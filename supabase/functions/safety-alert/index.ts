import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// deno-lint-ignore no-explicit-any
declare const Deno: any;

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const TWILIO_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_FROM = Deno.env.get('TWILIO_FROM_NUMBER');

async function sendSms(to: string, body: string) {
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) {
    console.log(`[safety-alert] SMS provider not configured. Would send to ${to}: ${body}`);
    return { ok: false, skipped: true };
  }
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: TWILIO_FROM, Body: body }),
  });
  const ok = res.ok;
  if (!ok) console.error('[safety-alert] twilio error', await res.text());
  return { ok, skipped: false };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const { sessionId, reason, origin } = (await req.json()) ?? {};
    if (!sessionId || typeof sessionId !== 'string') return json({ error: 'sessionId required' }, 400);
    const kind = reason === 'duress' ? 'duress' : reason === 'stale' ? 'stale' : 'manual';

    const { data: session, error } = await admin
      .from('safety_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (error || !session) return json({ error: 'Session not found' }, 404);
    if (session.status === 'completed') return json({ ok: true, skipped: 'completed' });

    // Already escalated in the last 5 minutes? Don't spam contacts.
    if (session.escalated_at && Date.now() - new Date(session.escalated_at).getTime() < 5 * 60 * 1000) {
      return json({ ok: true, skipped: 'recently_escalated' });
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('username')
      .eq('user_id', session.user_id)
      .maybeSingle();

    const { data: contacts } = await admin
      .from('emergency_contacts')
      .select('name, phone_number')
      .eq('user_id', session.user_id);

    const lat = session.current_lat ?? session.destination_lat;
    const lng = session.current_lng ?? session.destination_lng;
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    const trackUrl = origin ? `${origin}/track/${session.id}` : null;
    const who = profile?.username || 'A SCENE user';

    const headline =
      kind === 'duress'
        ? `🚨 EMERGENCY: ${who} triggered a duress alert during a Walk Me Home.`
        : kind === 'stale'
          ? `⚠️ ALERT: ${who} stopped sending location updates during a Walk Me Home.`
          : `⚠️ ${who} requested help during a Walk Me Home.`;

    const body = [
      headline,
      `Last known location: ${mapsUrl}`,
      session.battery_level != null ? `Phone battery: ${session.battery_level}%` : null,
      `Last ping: ${new Date(session.last_ping_at).toLocaleString()}`,
      trackUrl ? `Live track: ${trackUrl}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const results = [];
    for (const c of contacts ?? []) {
      results.push({ to: c.phone_number, ...(await sendSms(c.phone_number, body)) });
    }

    await admin
      .from('safety_sessions')
      .update({
        status: 'escalated',
        escalated_at: new Date().toISOString(),
        duress_flagged: kind === 'duress' ? true : session.duress_flagged,
      })
      .eq('id', sessionId);

    await admin.from('notifications').insert({
      user_id: session.user_id,
      type: 'safety_escalation',
      title: kind === 'duress' ? 'Duress alert sent' : 'Safety alert sent',
      body: `Your emergency contacts (${contacts?.length ?? 0}) were notified with your last known location.`,
      link: `/track/${session.id}`,
      meta: { session_id: session.id, reason: kind },
    });

    return json({ ok: true, notified: results.length, results });
  } catch (e) {
    console.error('[safety-alert]', e);
    return json({ error: 'Unexpected error' }, 500);
  }
});
