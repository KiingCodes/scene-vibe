// deno-lint-ignore-file no-explicit-any
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') || 'mailto:hello@scene.app',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
);

// Cadence-appropriate content per slot (SAST time).
function buildSlot(now: Date) {
  // Compute SAST hour (UTC+2)
  const sastHour = (now.getUTCHours() + 2) % 24;
  if (sastHour >= 17 && sastHour < 20) return 'earlyEvening';
  if (sastHour >= 20 && sastHour < 22) return 'peak';
  return 'lastCall';
}

const GENERIC: Record<string, { title: string; body: string }[]> = {
  earlyEvening: [
    { title: "🌆 Tonight's scene is loading", body: "Check who's trending before the doors open." },
    { title: '🍸 Where you drinking tonight?', body: "See what's popping in your city right now." },
  ],
  peak: [
    { title: '🔥 Peak vibes right now', body: "The dance floors are lit — pull up before it dies down." },
    { title: '📍 Who's out tonight?', body: 'Live crowd levels updated in the last few minutes.' },
  ],
  lastCall: [
    { title: '🌙 Last call energy', body: 'Which spot is still going? Check live vibes.' },
    { title: '🥂 After-parties dropping', body: 'Late-night crew activity happening now.' },
  ],
};

function pick<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const now = new Date();
  const slot = buildSlot(now);

  // Fetch trending club per country in the last 2h to personalize.
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data: recentVibes } = await supabase
    .from('vibes')
    .select('club_id')
    .gte('created_at', twoHoursAgo);

  const clubCounts = new Map<string, number>();
  (recentVibes ?? []).forEach((v: any) => {
    if (v.club_id) clubCounts.set(v.club_id, (clubCounts.get(v.club_id) ?? 0) + 1);
  });
  const topClubId = [...clubCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  let topClub: { id: string; name: string; country: string } | null = null;
  if (topClubId) {
    const { data } = await supabase.from('clubs').select('id,name,country').eq('id', topClubId).maybeSingle();
    if (data) topClub = data as any;
  }

  const { data: subs, error } = await supabase.from('push_subscriptions').select('*');
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let sent = 0, failed = 0, cleaned = 0;
  const staleEndpoints: string[] = [];

  for (const s of subs ?? []) {
    let payload: { title: string; body: string; url: string; tag: string };
    if (s.user_id && topClub && topClub.country === (s.country ?? 'ZA')) {
      // Personalized for signed-in users
      payload = {
        title: `🔥 ${topClub.name} is trending`,
        body: `${clubCounts.get(topClub.id)} vibes in the last 2 hours — pull up.`,
        url: `/club/${topClub.id}`,
        tag: `digest-${slot}-${topClub.id}`,
      };
    } else {
      const g = pick(GENERIC[slot]);
      payload = { ...g, url: '/', tag: `digest-${slot}` };
    }

    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
        { TTL: 3600 },
      );
      sent++;
    } catch (e: any) {
      failed++;
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        staleEndpoints.push(s.endpoint);
      }
    }
  }

  if (staleEndpoints.length) {
    await supabase.from('push_subscriptions').delete().in('endpoint', staleEndpoints);
    cleaned = staleEndpoints.length;
  }

  return new Response(JSON.stringify({ slot, sent, failed, cleaned }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});