import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Search, ShieldCheck, Ban, UserCog, Trash2, Crown, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAdminAuditLog } from '@/hooks/useAdminStats';

const glass = 'rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-2xl';

const ago = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'ban', label: 'Bans & blocks' },
  { id: 'role', label: 'Roles' },
  { id: 'delete', label: 'Deletions' },
  { id: 'claim', label: 'Venues' },
] as const;

const matchesFilter = (action: string, filter: string) => {
  if (filter === 'all') return true;
  if (filter === 'ban') return /ban|block|warn/.test(action);
  if (filter === 'role') return /role/.test(action);
  if (filter === 'delete') return /delete/.test(action);
  if (filter === 'claim') return /claim|venue|subscription/.test(action);
  return true;
};

const iconFor = (action: string) => {
  if (/ban|block/.test(action)) return Ban;
  if (/role/.test(action)) return Crown;
  if (/delete/.test(action)) return Trash2;
  if (/claim|venue|subscription/.test(action)) return ShieldCheck;
  if (/profile|warn|points/.test(action)) return UserCog;
  return Activity;
};

const toneFor = (action: string) => {
  if (/ban|block|delete/.test(action)) return '#EC4899';
  if (/role|approve|active/.test(action)) return '#10B981';
  if (/claim|venue|subscription/.test(action)) return '#06B6D4';
  return '#8B5CF6';
};

/** Names for admin + target user ids so the trail reads like a story, not UUIDs. */
const useUsernames = (ids: string[]) =>
  useQuery({
    queryKey: ['audit-usernames', ids.slice().sort().join(',')],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('profiles').select('user_id, username').in('user_id', ids);
      const map: Record<string, string> = {};
      (data || []).forEach((p: any) => { map[p.user_id] = p.username || 'Anonymous'; });
      return map;
    },
  });

/** Rich, filterable, live-updating admin audit trail. */
const AuditTrail = ({ targetUserId, compact }: { targetUserId?: string; compact?: boolean }) => {
  const { data: entries = [], isLoading } = useAdminAuditLog(targetUserId);
  const [filter, setFilter] = useState<string>('all');
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const ids = useMemo(() => {
    const s = new Set<string>();
    entries.forEach((e: any) => {
      if (e.admin_id) s.add(e.admin_id);
      if (e.target_user_id) s.add(e.target_user_id);
    });
    return [...s];
  }, [entries]);
  const { data: names = {} } = useUsernames(ids);

  const rows = useMemo(
    () => entries.filter((e: any) =>
      matchesFilter(String(e.action), filter) &&
      (!q || JSON.stringify(e).toLowerCase().includes(q.toLowerCase()))),
    [entries, filter, q],
  );

  return (
    <div className={`${glass} overflow-hidden`}>
      <div className="flex flex-wrap items-center gap-2 border-b border-white/5 p-4">
        <History className="h-4 w-4 text-[#06B6D4]" />
        <span className="text-xs uppercase tracking-widest text-zinc-400">Admin audit trail</span>
        <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 px-2 py-0.5 text-[10px] uppercase text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> live
        </span>
        <span className="ml-auto text-[11px] text-zinc-500">{rows.length} entries</span>
      </div>

      {!compact && (
        <div className="flex flex-wrap items-center gap-2 border-b border-white/5 p-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search actions…"
              className="h-8 border-white/10 bg-white/5 pl-8 text-xs" />
          </div>
          {FILTERS.map((f) => (
            <Button key={f.id} size="sm" variant="outline"
              onClick={() => setFilter(f.id)}
              className={`h-8 rounded-full border-white/10 text-[11px] ${
                filter === f.id ? 'bg-[#06B6D4]/15 text-[#67E8F9]' : 'bg-white/5 text-zinc-400'}`}>
              {f.label}
            </Button>
          ))}
        </div>
      )}

      <div className="divide-y divide-white/5">
        {isLoading && <div className="p-6 text-center text-sm text-zinc-500">Loading trail…</div>}
        {!isLoading && rows.length === 0 && (
          <div className="p-6 text-center text-sm text-zinc-500">No admin actions match this view yet.</div>
        )}
        <AnimatePresence initial={false}>
          {rows.map((e: any) => {
            const Icon = iconFor(String(e.action));
            const tone = toneFor(String(e.action));
            const open = expanded === e.id;
            return (
              <motion.button
                key={e.id}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                onClick={() => setExpanded(open ? null : e.id)}
                className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-white/[0.03]"
              >
                <span className="mt-0.5 rounded-lg border p-1.5"
                  style={{ borderColor: `${tone}55`, color: tone }}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium capitalize text-zinc-100">
                    {String(e.action).replace(/_/g, ' ')}
                  </div>
                  <div className="truncate text-xs text-zinc-500">
                    by {names[e.admin_id] || 'admin'}
                    {e.target_user_id ? ` → ${names[e.target_user_id] || String(e.target_user_id).slice(0, 8)}` : ' · platform action'}
                  </div>
                  {open && e.details && (
                    <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-black/40 p-2 text-[11px] text-zinc-400">
                      {JSON.stringify(e.details, null, 2)}
                    </pre>
                  )}
                </div>
                <span className="whitespace-nowrap text-[11px] text-zinc-500">{ago(e.created_at)}</span>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuditTrail;
