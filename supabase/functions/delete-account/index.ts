import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

// Tables keyed by user_id that should be wiped before the auth user is removed.
const USER_TABLES = [
  'push_subscriptions', 'notifications', 'favorites', 'reviews', 'club_ratings', 'vibes', 'pulling_up',
  'messages', 'message_flags', 'media', 'user_badges', 'user_points', 'night_plans', 'crew_members',
  'crew_locations', 'crew_votes', 'video_comments', 'video_likes', 'video_reactions', 'videos',
  'emergency_contacts', 'safety_sessions', 'experience_attendances', 'profiles',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: 'Unauthorized' }, 401);

    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    await admin.from('user_follows').delete().or(`follower_id.eq.${user.id},following_id.eq.${user.id}`);
    for (const table of USER_TABLES) {
      const { error } = await admin.from(table).delete().eq('user_id', user.id);
      if (error) console.error(`cleanup ${table}:`, error.message);
    }
    // Release any venues they owned instead of deleting the venue listing.
    await admin.from('clubs').update({ owner_id: null }).eq('owner_id', user.id);

    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;

    return json({ success: true });
  } catch (err) {
    console.error(err);
    return json({ error: 'Could not delete account' }, 500);
  }
});
