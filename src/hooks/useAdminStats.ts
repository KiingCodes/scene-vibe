import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const since = (ms: number) => new Date(Date.now() - ms).toISOString();

/** Live platform-wide ops snapshot for the admin command center. */
export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    refetchInterval: 30_000,
    queryFn: async () => {
      const m30 = since(30 * 60_000);
      const h24 = since(24 * 3600_000);
      const d7  = since(7 * 24 * 3600_000);
      const d30 = since(30 * 24 * 3600_000);

      const sb: any = supabase;
      const head = (table: string) => sb.from(table).select('*', { count: 'exact', head: true });
      const [
        users, clubs, experiences, videos, vibes30, pulls30, attend30,
        flags, pendingClubs, pendingExp, pendingPromo,
        newUsers7, newUsers30, vibes24, attend24, videos24, follows24,
      ] = await Promise.all([
        head('profiles'),
        head('clubs'),
        head('experiences'),
        head('videos'),
        head('vibes').gte('created_at', m30),
        head('pulling_up').gte('created_at', m30),
        head('experience_attendances').gte('created_at', m30),
        head('message_flags'),
        head('pending_clubs').eq('status', 'pending'),
        head('experiences').eq('status', 'pending'),
        head('promotions').eq('status', 'pending'),
        head('profiles').gte('created_at', d7),
        head('profiles').gte('created_at', d30),
        head('vibes').gte('created_at', h24),
        head('experience_attendances').gte('created_at', h24),
        head('videos').gte('created_at', h24),
        head('user_follows').gte('created_at', h24),
      ]);

      return {
        users: users.count || 0,
        clubs: clubs.count || 0,
        experiences: experiences.count || 0,
        videos: videos.count || 0,
        vibesNow: vibes30.count || 0,
        pullingNow: pulls30.count || 0,
        attendNow: attend30.count || 0,
        flags: flags.count || 0,
        pendingClubs: pendingClubs.count || 0,
        pendingExp: pendingExp.count || 0,
        pendingPromo: pendingPromo.count || 0,
        newUsers7: newUsers7.count || 0,
        newUsers30: newUsers30.count || 0,
        vibes24: vibes24.count || 0,
        attend24: attend24.count || 0,
        videos24: videos24.count || 0,
        follows24: follows24.count || 0,
      };
    },
  });
};

/** Real-time activity feed combining latest events across the platform. */
export const useRecentActivity = () => {
  return useQuery({
    queryKey: ['admin-activity'],
    refetchInterval: 20_000,
    queryFn: async () => {
      const [vibes, pulls, videos, follows, attend] = await Promise.all([
        supabase.from('vibes').select('id, club_id, created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('pulling_up').select('id, club_id, created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('videos').select('id, caption, user_id, created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('user_follows').select('id, follower_id, following_id, created_at' as any).order('created_at' as any, { ascending: false }).limit(10),
        (supabase as any).from('experience_attendances').select('id, experience_id, type, created_at').order('created_at', { ascending: false }).limit(10),
      ]);
      const items: { id: string; kind: string; at: string; label: string; sub?: string }[] = [];
      vibes.data?.forEach((r: any) => items.push({ id: r.id, kind: 'vibe', at: r.created_at, label: 'Vibe sent', sub: `club ${String(r.club_id).slice(0,6)}` }));
      pulls.data?.forEach((r: any) => items.push({ id: r.id, kind: 'pulling_up', at: r.created_at, label: 'Pulling up', sub: `club ${String(r.club_id).slice(0,6)}` }));
      videos.data?.forEach((r: any) => items.push({ id: r.id, kind: 'video', at: r.created_at, label: 'New video', sub: r.caption || '—' }));
      follows.data?.forEach((r: any) => items.push({ id: r.id, kind: 'follow', at: r.created_at, label: 'New follow' }));
      attend.data?.forEach((r: any) => items.push({ id: r.id, kind: 'attendance', at: r.created_at, label: `Marked ${r.type}`, sub: `exp ${String(r.experience_id).slice(0,6)}` }));
      return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 25);
    },
  });
};

/** Live check-in dashboard + naive duplicate detection (same device, same target, <2 min apart). */
export const useCheckinMonitor = () => {
  return useQuery({
    queryKey: ['admin-checkins'],
    refetchInterval: 30_000,
    queryFn: async () => {
      const cutoff = since(2 * 3600_000);
      const [vibes, pulls, attend] = await Promise.all([
        supabase.from('vibes').select('id, club_id, device_id, created_at').gte('created_at', cutoff).order('created_at', { ascending: false }),
        supabase.from('pulling_up').select('id, club_id, device_id, created_at').gte('created_at', cutoff).order('created_at', { ascending: false }),
        (supabase as any).from('experience_attendances').select('id, experience_id, device_id, type, created_at').gte('created_at', cutoff).order('created_at', { ascending: false }),
      ]);
      const rows = [
        ...(vibes.data || []).map((r: any) => ({ ...r, kind: 'vibe', target: r.club_id })),
        ...(pulls.data || []).map((r: any) => ({ ...r, kind: 'pulling_up', target: r.club_id })),
        ...(attend.data || []).map((r: any) => ({ ...r, kind: r.type, target: r.experience_id })),
      ];
      // duplicate detection: same device + target + kind within 2 minutes
      const seen = new Map<string, string>();
      const dupes: any[] = [];
      rows.sort((a, b) => a.created_at.localeCompare(b.created_at));
      for (const r of rows) {
        const key = `${r.device_id}:${r.target}:${r.kind}`;
        const last = seen.get(key);
        if (last && new Date(r.created_at).getTime() - new Date(last).getTime() < 120_000) dupes.push(r);
        seen.set(key, r.created_at);
      }
      return { rows: rows.slice(-100).reverse(), dupes };
    },
  });
};

/** Recent users for the user-management tab. */
export const useAdminUsers = (search: string = '') => {
  return useQuery({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      let q = supabase
        .from('profiles')
        .select('user_id, username, avatar_url, created_at, is_blocked, is_banned, warning_count, ban_reason, bio' as any)
        .order('created_at' as any, { ascending: false })
        .limit(100);
      if (search) q = (q as any).ilike('username', `%${search}%`);
      const { data } = await q;
      const ids = (data || []).map((u: any) => u.user_id);
      if (!ids.length) return [];
      const [points, roles] = await Promise.all([
        supabase.from('user_points').select('user_id, points').in('user_id', ids),
        supabase.from('user_roles').select('user_id, role').in('user_id', ids),
      ]);
      const pmap = new Map((points.data || []).map((p: any) => [p.user_id, p.points]));
      const rmap = new Map<string, string[]>();
      (roles.data || []).forEach((r: any) => {
        const arr = rmap.get(r.user_id) || [];
        arr.push(r.role); rmap.set(r.user_id, arr);
      });
      return (data || []).map((u: any) => ({ ...u, points: pmap.get(u.user_id) ?? 0, roles: rmap.get(u.user_id) ?? [] }));
    },
  });
};

/* ---------------- Admin moderation actions ---------------- */

const logAudit = async (adminId: string, targetUserId: string | null, action: string, details?: any) => {
  try {
    await (supabase as any).from('admin_audit_log').insert({
      admin_id: adminId, target_user_id: targetUserId, action, details: details ?? null,
    });
  } catch {}
};

export const useAdminUserActions = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-users'] });
    qc.invalidateQueries({ queryKey: ['admin-audit'] });
  };

  const updateProfile = useMutation({
    mutationFn: async ({ userId, patch }: { userId: string; patch: Record<string, any> }) => {
      const { error } = await (supabase as any).from('profiles').update({
        ...patch, moderated_at: new Date().toISOString(), moderated_by: user?.id,
      }).eq('user_id', userId);
      if (error) throw error;
      await logAudit(user!.id, userId, 'update_profile', patch);
    },
    onSuccess: invalidate,
  });

  const setBlocked = useMutation({
    mutationFn: async ({ userId, blocked, reason }: { userId: string; blocked: boolean; reason?: string }) => {
      const { error } = await (supabase as any).from('profiles').update({
        is_blocked: blocked, ban_reason: blocked ? reason ?? null : null,
        moderated_at: new Date().toISOString(), moderated_by: user?.id,
      }).eq('user_id', userId);
      if (error) throw error;
      await logAudit(user!.id, userId, blocked ? 'block' : 'unblock', { reason });
    },
    onSuccess: invalidate,
  });

  const setBanned = useMutation({
    mutationFn: async ({ userId, banned, reason }: { userId: string; banned: boolean; reason?: string }) => {
      const { error } = await (supabase as any).from('profiles').update({
        is_banned: banned, ban_reason: banned ? reason ?? null : null,
        moderated_at: new Date().toISOString(), moderated_by: user?.id,
      }).eq('user_id', userId);
      if (error) throw error;
      await logAudit(user!.id, userId, banned ? 'ban' : 'unban', { reason });
    },
    onSuccess: invalidate,
  });

  const warn = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      const { data: cur } = await (supabase as any).from('profiles')
        .select('warning_count').eq('user_id', userId).maybeSingle();
      const next = (cur?.warning_count ?? 0) + 1;
      const { error } = await (supabase as any).from('profiles').update({
        warning_count: next, moderated_at: new Date().toISOString(), moderated_by: user?.id,
      }).eq('user_id', userId);
      if (error) throw error;
      await logAudit(user!.id, userId, 'warn', { reason, total: next });
    },
    onSuccess: invalidate,
  });

  const setRole = useMutation({
    mutationFn: async ({ userId, role, grant }: { userId: string; role: 'admin' | 'moderator' | 'user'; grant: boolean }) => {
      if (grant) {
        const { error } = await (supabase as any).from('user_roles')
          .upsert({ user_id: userId, role }, { onConflict: 'user_id,role' });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', role);
        if (error) throw error;
      }
      await logAudit(user!.id, userId, grant ? 'grant_role' : 'revoke_role', { role });
    },
    onSuccess: invalidate,
  });

  const adjustPoints = useMutation({
    mutationFn: async ({ userId, points }: { userId: string; points: number }) => {
      const { data: cur } = await supabase.from('user_points').select('points').eq('user_id', userId).maybeSingle();
      if (cur) {
        const { error } = await supabase.from('user_points').update({ points, updated_at: new Date().toISOString() }).eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_points').insert({ user_id: userId, points });
        if (error) throw error;
      }
      await logAudit(user!.id, userId, 'adjust_points', { points });
    },
    onSuccess: invalidate,
  });

  return { updateProfile, setBlocked, setBanned, warn, setRole, adjustPoints };
};

export const useAdminAuditLog = (targetUserId?: string) => {
  return useQuery({
    queryKey: ['admin-audit', targetUserId ?? 'all'],
    queryFn: async () => {
      let q = (supabase as any).from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(50);
      if (targetUserId) q = q.eq('target_user_id', targetUserId);
      const { data } = await q;
      return data || [];
    },
  });
};

/** Generic admin delete: works on any table exposed via RLS admin policies. */
export const useAdminDelete = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ table, id, label }: { table: string; id: string; label?: string }) => {
      const { error } = await (supabase as any).from(table).delete().eq('id', id);
      if (error) throw error;
      await logAudit(user!.id, null, `delete_${table}`, { id, label });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-activity'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      qc.invalidateQueries({ queryKey: ['admin-checkins'] });
      qc.invalidateQueries({ queryKey: ['admin-messages'] });
      qc.invalidateQueries({ queryKey: ['admin-audit'] });
    },
  });
};

/** Recent chat/community messages for moderation. */
export const useAdminMessages = () => {
  return useQuery({
    queryKey: ['admin-messages'],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('messages')
        .select('id, content, user_id, club_id, created_at, is_hidden, flag_count')
        .order('created_at', { ascending: false })
        .limit(30);
      return data || [];
    },
  });
};

/** Trigger sync-venue-data edge function on demand (mode=refresh). */
export const useTriggerSync = () => {
  return useMutation({
    mutationFn: async (mode: 'heal' | 'refresh' = 'refresh') => {
      const { data, error } = await supabase.functions.invoke('sync-venue-data', { body: { mode } });
      if (error) throw error;
      return data;
    },
  });
};

/** Category popularity + most popular experiences (by attendance in last 7d). */
export const useAdminAnalytics = () => {
  return useQuery({
    queryKey: ['admin-analytics'],
    refetchInterval: 60_000,
    queryFn: async () => {
      const d7 = since(7 * 24 * 3600_000);
      const [clubs, exps, attend] = await Promise.all([
        supabase.from('clubs').select('id, name, genre, area'),
        (supabase as any).from('experiences').select('id, name, category, area'),
        (supabase as any).from('experience_attendances').select('experience_id, created_at').gte('created_at', d7),
      ]);
      const genreCounts: Record<string, number> = {};
      clubs.data?.forEach((c: any) => { if (c.genre) genreCounts[c.genre] = (genreCounts[c.genre] || 0) + 1; });
      const areaCounts: Record<string, number> = {};
      clubs.data?.forEach((c: any) => { if (c.area) areaCounts[c.area] = (areaCounts[c.area] || 0) + 1; });
      const catCounts: Record<string, number> = {};
      exps.data?.forEach((e: any) => { if (e.category) catCounts[e.category] = (catCounts[e.category] || 0) + 1; });
      const expHits: Record<string, number> = {};
      attend.data?.forEach((a: any) => { expHits[a.experience_id] = (expHits[a.experience_id] || 0) + 1; });
      const expById = new Map<string, any>((exps.data || []).map((e: any) => [e.id, e]));
      const topExps = Object.entries(expHits)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => ({ id, count, name: expById.get(id)?.name || 'Unknown' }));
      return { genreCounts, areaCounts, catCounts, topExps };
    },
  });
};