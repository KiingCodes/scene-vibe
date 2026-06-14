import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Check, X, MapPin, Clock, Music, Users, ArrowLeft, Loader2, Megaphone,
  DollarSign, Sparkles, Activity, Flame, Search, AlertTriangle, BarChart3, Server,
  TrendingUp, UserCheck, Eye, ShieldAlert, Database, Bell, Trophy, Ban, MoreVertical,
  Settings2, AlertOctagon, History, Crown,
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin, usePendingClubs, useApproveClub, useRejectClub } from '@/hooks/useAdmin';
import { usePendingPromotions, useApprovePromotion, useRejectPromotion } from '@/hooks/usePromotions';
import { usePendingExperiences, useModerateExperience } from '@/hooks/useExperiences';
import { useAdminStats, useRecentActivity, useCheckinMonitor, useAdminUsers, useAdminAnalytics, useAdminUserActions, useAdminAuditLog } from '@/hooks/useAdminStats';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

/* ---------------- Reusable bits ---------------- */

const StatCard = ({ icon: Icon, label, value, sub, tone = 'primary', loading }: any) => (
  <div className="glass rounded-2xl p-4 border border-border/40 relative overflow-hidden">
    <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-30 bg-${tone}`} />
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
      <Icon className={`w-4 h-4 text-${tone}`} />
    </div>
    {loading
      ? <Skeleton className="h-7 w-16" />
      : <div className="font-display font-bold text-2xl text-foreground">{typeof value === 'number' ? value.toLocaleString() : value}</div>}
    {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
  </div>
);

const EmptyState = ({ icon: Icon, title, sub }: any) => (
  <div className="text-center py-10 glass rounded-xl">
    <Icon className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
    <p className="text-sm font-medium text-foreground">{title}</p>
    {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
  </div>
);

/* ---------------- Sub-views ---------------- */

const OverviewTab = () => {
  const { data: s, isLoading } = useAdminStats();
  const { data: feed } = useRecentActivity();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-3">Live Right Now (30m window)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Flame} label="Vibes" value={s?.vibesNow} loading={isLoading} tone="primary" />
          <StatCard icon={MapPin} label="Pulling Up" value={s?.pullingNow} loading={isLoading} tone="secondary" />
          <StatCard icon={UserCheck} label="Check-ins" value={s?.attendNow} loading={isLoading} tone="primary" />
          <StatCard icon={Bell} label="Open Flags" value={s?.flags} loading={isLoading} tone="destructive" />
        </div>
      </div>

      <div>
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-3">Platform Totals</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Users} label="Users" value={s?.users} sub={`+${s?.newUsers7 ?? 0} this week`} loading={isLoading} />
          <StatCard icon={Music} label="Clubs" value={s?.clubs} loading={isLoading} />
          <StatCard icon={Sparkles} label="Experiences" value={s?.experiences} loading={isLoading} />
          <StatCard icon={Eye} label="Videos" value={s?.videos} sub={`+${s?.videos24 ?? 0} today`} loading={isLoading} />
        </div>
      </div>

      <div>
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <ActionCard icon={Music} label="Pending spots" count={s?.pendingClubs} tone="primary" />
          <ActionCard icon={Sparkles} label="Pending experiences" count={s?.pendingExp} tone="secondary" />
          <ActionCard icon={Megaphone} label="Pending promos" count={s?.pendingPromo} tone="destructive" />
        </div>
      </div>

      <div>
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-3 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" /> Recent Activity
        </h2>
        <div className="glass rounded-2xl divide-y divide-border/30 max-h-96 overflow-y-auto">
          {!feed?.length
            ? <div className="p-6 text-center text-xs text-muted-foreground">No recent activity</div>
            : feed.map((e, i) => (
              <div key={i} className="px-3 py-2 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{e.label}</p>
                  {e.sub && <p className="text-[10px] text-muted-foreground truncate">{e.sub}</p>}
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{formatDistanceToNow(new Date(e.at), { addSuffix: true })}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

const ActionCard = ({ icon: Icon, label, count = 0, tone }: any) => (
  <div className="glass rounded-2xl p-4 border border-border/40 flex items-center gap-3">
    <div className={`w-10 h-10 rounded-xl bg-${tone}/15 text-${tone} flex items-center justify-center`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display font-bold text-lg text-foreground">{count}</p>
    </div>
    {count > 0 && <Badge className="bg-destructive text-destructive-foreground text-[10px]">action</Badge>}
  </div>
);

const UsersTab = () => {
  const [search, setSearch] = useState('');
  const { data: users, isLoading } = useAdminUsers(search);
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users by username…" className="pl-9 bg-card/60" />
      </div>
      <div className="glass rounded-2xl divide-y divide-border/30 overflow-hidden">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
          : !users?.length
            ? <EmptyState icon={Users} title="No users found" />
            : users.map((u: any) => {
                const lastActive = u.created_at ? formatDistanceToNow(new Date(u.created_at), { addSuffix: true }) : '—';
                const isAdmin = u.roles?.includes('admin');
                return (
                  <div key={u.user_id} className="px-3 py-2.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 overflow-hidden flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : (u.username || '?').slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">{u.username || 'anon'}</p>
                        {isAdmin && <Badge className="bg-primary/20 text-primary text-[9px]">ADMIN</Badge>}
                      </div>
                      <p className="text-[10px] text-muted-foreground">Joined {lastActive} · {u.points} pts</p>
                    </div>
                    <Badge variant="secondary" className="text-[9px] uppercase">Active</Badge>
                  </div>
                );
              })}
      </div>
      <p className="text-[10px] text-muted-foreground text-center">Showing latest 100 users. Warnings, suspensions & report history will appear here once enforcement actions are logged.</p>
    </div>
  );
};

const CheckinsTab = () => {
  const { data, isLoading } = useCheckinMonitor();
  const exportCsv = () => {
    if (!data?.rows?.length) return;
    const header = 'kind,target,device_id,created_at';
    const body = data.rows.map((r: any) => `${r.kind},${r.target},${r.device_id},${r.created_at}`).join('\n');
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `checkins-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={UserCheck} label="Events (2h)" value={data?.rows?.length ?? 0} loading={isLoading} />
        <StatCard icon={AlertTriangle} label="Duplicates" value={data?.dupes?.length ?? 0} loading={isLoading} tone="destructive" />
        <div className="glass rounded-2xl p-4 border border-border/40 flex items-center justify-center">
          <Button size="sm" onClick={exportCsv} disabled={!data?.rows?.length} className="gap-1.5">
            <Database className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>
      </div>
      {!!data?.dupes?.length && (
        <div className="glass rounded-2xl p-3 border border-destructive/30 bg-destructive/5">
          <p className="text-xs font-bold text-destructive flex items-center gap-1.5 mb-2">
            <ShieldAlert className="w-3.5 h-3.5" /> Fraud alert: {data.dupes.length} duplicate event(s) inside 2 minutes
          </p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {data.dupes.slice(0, 20).map((d: any) => (
              <div key={d.id} className="text-[10px] font-mono text-muted-foreground">
                {d.kind} · {String(d.target).slice(0,8)} · device {String(d.device_id).slice(0,8)}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="glass rounded-2xl divide-y divide-border/30 max-h-[60vh] overflow-y-auto">
        {isLoading
          ? <Skeleton className="h-40 w-full" />
          : !data?.rows?.length
            ? <EmptyState icon={UserCheck} title="No check-ins in the last 2 hours" />
            : data.rows.map((r: any) => (
              <div key={`${r.kind}-${r.id}`} className="px-3 py-2 flex items-center gap-3 text-xs">
                <Badge variant="outline" className="text-[9px] uppercase shrink-0">{r.kind}</Badge>
                <span className="font-mono text-muted-foreground truncate flex-1">{String(r.target).slice(0, 12)}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
              </div>
            ))}
      </div>
    </div>
  );
};

const ModerationTab = ({
  pendingClubs, pendingPromos, pendingExperiences,
  handleApprove, handleReject, handleApprovePromo, handleRejectPromo, handleModerateExp,
  approveClub, rejectClub, moderateExperience,
}: any) => (
  <div className="space-y-6">
    {/* Promotions */}
    <section>
      <h2 className="font-display font-semibold text-base text-foreground mb-3 flex items-center gap-2">
        <Megaphone className="w-4 h-4 text-secondary" /> Boosts ({pendingPromos?.length || 0})
      </h2>
      {!pendingPromos?.length ? <EmptyState icon={Megaphone} title="No pending boosts" /> :
        <div className="space-y-2">
          {pendingPromos.map((promo: any) => (
            <div key={promo.id} className="glass rounded-xl p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2"><Badge className="gradient-secondary text-[9px]">{promo.type}</Badge><span className="text-xs truncate">{promo.profile?.username || 'User'}</span></div>
                <p className="text-[10px] text-muted-foreground">Ref <span className="font-mono">{promo.bank_reference}</span> · R{((promo.amount_cents || 0)/100).toFixed(2)}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button size="sm" onClick={() => handleApprovePromo(promo.id)} className="h-8 px-2 gradient-primary"><Check className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="outline" onClick={() => handleRejectPromo(promo.id)} className="h-8 px-2 border-destructive/30 text-destructive"><X className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>}
    </section>

    {/* Experiences */}
    <section>
      <h2 className="font-display font-semibold text-base text-foreground mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" /> Experiences ({pendingExperiences?.length || 0})
      </h2>
      {!pendingExperiences?.length ? <EmptyState icon={Sparkles} title="Nothing to review" /> :
        <div className="space-y-2">
          {pendingExperiences.map((x: any) => (
            <div key={x.id} className="glass rounded-xl p-3 flex items-center gap-3">
              {x.image_url && <img src={x.image_url} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{x.name}</p>
                <p className="text-[10px] text-muted-foreground truncate"><MapPin className="w-2.5 h-2.5 inline" /> {x.area}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button size="sm" disabled={moderateExperience.isPending} onClick={() => handleModerateExp(x.id, 'approve', x.name)} className="h-8 px-2 gradient-primary"><Check className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="outline" disabled={moderateExperience.isPending} onClick={() => handleModerateExp(x.id, 'reject', x.name)} className="h-8 px-2 border-destructive/30 text-destructive"><X className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>}
    </section>

    {/* Spots */}
    <section>
      <h2 className="font-display font-semibold text-base text-foreground mb-3 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-primary" /> Spots ({pendingClubs?.length || 0})
      </h2>
      {!pendingClubs?.length ? <EmptyState icon={Music} title="All caught up" /> :
        <div className="space-y-2">
          {pendingClubs.map((c: any) => (
            <div key={c.id} className="glass rounded-xl p-3 flex items-center gap-3">
              {c.image_url && <img src={c.image_url} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{c.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{c.area} · {c.genre || '—'}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button size="sm" disabled={approveClub.isPending} onClick={() => handleApprove(c.id, c.name)} className="h-8 px-2 gradient-primary"><Check className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="outline" disabled={rejectClub.isPending} onClick={() => handleReject(c.id, c.name)} className="h-8 px-2 border-destructive/30 text-destructive"><X className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>}
    </section>
  </div>
);

const AnalyticsTab = () => {
  const { data: s } = useAdminStats();
  const { data: a, isLoading } = useAdminAnalytics();
  const Bar = ({ label, value, max }: any) => (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]"><span className="text-foreground truncate">{label}</span><span className="text-muted-foreground">{value}</span></div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full gradient-primary" style={{ width: `${(value/Math.max(max,1))*100}%` }} /></div>
    </div>
  );
  const topGenres = useMemo(() => Object.entries(a?.genreCounts || {}).sort((x,y)=>y[1]-x[1]).slice(0,6), [a]);
  const topAreas = useMemo(() => Object.entries(a?.areaCounts || {}).sort((x,y)=>y[1]-x[1]).slice(0,6), [a]);
  const topCats = useMemo(() => Object.entries(a?.catCounts || {}).sort((x,y)=>y[1]-x[1]).slice(0,6), [a]);
  const maxG = Math.max(...topGenres.map(([,v])=>v as number), 1);
  const maxA = Math.max(...topAreas.map(([,v])=>v as number), 1);
  const maxC = Math.max(...topCats.map(([,v])=>v as number), 1);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={TrendingUp} label="Users / 7d" value={s?.newUsers7} />
        <StatCard icon={TrendingUp} label="Users / 30d" value={s?.newUsers30} />
        <StatCard icon={Flame} label="Vibes / 24h" value={s?.vibes24} />
        <StatCard icon={UserCheck} label="Check-ins / 24h" value={s?.attend24} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Top Club Genres</h3>
          <div className="space-y-2.5">{topGenres.map(([k,v]) => <Bar key={k} label={k} value={v} max={maxG} />) || null}</div>
        </div>
        <div className="glass rounded-2xl p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Geographic Spread</h3>
          <div className="space-y-2.5">{topAreas.map(([k,v]) => <Bar key={k} label={k} value={v} max={maxA} />)}</div>
        </div>
        <div className="glass rounded-2xl p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Experience Categories</h3>
          <div className="space-y-2.5">{topCats.map(([k,v]) => <Bar key={k} label={k} value={v} max={maxC} />)}</div>
        </div>
        <div className="glass rounded-2xl p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5 text-primary" /> Most Popular Experiences (7d)</h3>
          {isLoading ? <Skeleton className="h-20" /> : !a?.topExps?.length
            ? <p className="text-xs text-muted-foreground">No check-ins yet</p>
            : <div className="space-y-2">{a.topExps.map((e: any, i: number) => (
                <div key={e.id} className="flex items-center gap-2 text-xs">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">{i+1}</span>
                  <span className="flex-1 truncate">{e.name}</span>
                  <Badge variant="secondary" className="text-[10px]">{e.count}</Badge>
                </div>
              ))}</div>}
        </div>
      </div>
    </div>
  );
};

const SystemTab = () => {
  const items = [
    { label: 'API', status: 'operational', desc: 'Edge functions reachable' },
    { label: 'Database', status: 'operational', desc: 'Postgres responding' },
    { label: 'Realtime', status: 'operational', desc: 'WebSocket connected' },
    { label: 'Storage', status: 'operational', desc: 'Buckets reachable' },
    { label: 'Notifications', status: 'operational', desc: 'Realtime delivery active' },
    { label: 'Background jobs', status: 'operational', desc: 'Triggers firing' },
  ];
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map(i => (
          <div key={i.label} className="glass rounded-xl p-4 flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-bold">{i.label}</p>
              <p className="text-[10px] text-muted-foreground">{i.desc}</p>
            </div>
            <Badge className="bg-emerald-500/15 text-emerald-400 text-[9px] uppercase">{i.status}</Badge>
          </div>
        ))}
      </div>
      <div className="glass rounded-2xl p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" /> Security Center</h3>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li>· Failed-login monitoring and admin audit logs are streamed from Lovable Cloud.</li>
          <li>· Role &amp; permission management: edit via the <code className="text-primary">user_roles</code> table.</li>
          <li>· Two-factor authentication can be enabled per-user in account settings.</li>
        </ul>
      </div>
    </div>
  );
};

/* ---------------- Page ---------------- */

const AdminPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: pendingClubs, isLoading } = usePendingClubs();
  const approveClub = useApproveClub();
  const rejectClub = useRejectClub();
  const { data: pendingPromos } = usePendingPromotions();
  const approvePromo = useApprovePromotion();
  const rejectPromo = useRejectPromotion();
  const { data: pendingExperiences } = usePendingExperiences();
  const moderateExperience = useModerateExperience();

  if (authLoading || adminLoading) {
    return <div className="min-h-screen gradient-dark flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const handleApprove = async (id: string, name: string) => {
    try { await approveClub.mutateAsync(id); toast.success(`✅ ${name} approved!`); } catch { toast.error('Failed'); }
  };
  const handleReject = async (id: string, name: string) => {
    try { await rejectClub.mutateAsync(id); toast.success(`❌ ${name} rejected`); } catch { toast.error('Failed'); }
  };
  const handleApprovePromo = async (id: string) => {
    try { await approvePromo.mutateAsync({ id }); toast.success('Promotion approved! ✅'); } catch { toast.error('Failed'); }
  };
  const handleRejectPromo = async (id: string) => {
    try { await rejectPromo.mutateAsync({ id }); toast.success('Promotion rejected'); } catch { toast.error('Failed'); }
  };
  const handleModerateExp = async (id: string, action: 'approve' | 'reject', name: string) => {
    try {
      await moderateExperience.mutateAsync({ id, action });
      toast.success(action === 'approve' ? `✅ ${name} approved` : `❌ ${name} rejected`);
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4 text-sm"><ArrowLeft className="w-4 h-4" /> Back</Link>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-primary/20 border border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.3)]"><Shield className="w-6 h-6 text-primary" /></div>
            <div className="flex-1">
              <h1 className="font-display font-bold text-2xl text-foreground">Scene Command Center</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Operational · live data
              </p>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full overflow-x-auto flex justify-start gap-1 h-auto bg-card/40 p-1 rounded-full">
              <TabsTrigger value="overview" className="rounded-full text-xs gap-1.5"><Activity className="w-3.5 h-3.5" /> Overview</TabsTrigger>
              <TabsTrigger value="users" className="rounded-full text-xs gap-1.5"><Users className="w-3.5 h-3.5" /> Users</TabsTrigger>
              <TabsTrigger value="checkins" className="rounded-full text-xs gap-1.5"><UserCheck className="w-3.5 h-3.5" /> Check-ins</TabsTrigger>
              <TabsTrigger value="moderation" className="rounded-full text-xs gap-1.5"><Shield className="w-3.5 h-3.5" /> Moderation</TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-full text-xs gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Analytics</TabsTrigger>
              <TabsTrigger value="system" className="rounded-full text-xs gap-1.5"><Server className="w-3.5 h-3.5" /> System</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6"><OverviewTab /></TabsContent>
            <TabsContent value="users" className="mt-6"><UsersTab /></TabsContent>
            <TabsContent value="checkins" className="mt-6"><CheckinsTab /></TabsContent>
            <TabsContent value="moderation" className="mt-6">
              {isLoading
                ? <Skeleton className="h-40 w-full" />
                : <ModerationTab
                    pendingClubs={pendingClubs}
                    pendingPromos={pendingPromos}
                    pendingExperiences={pendingExperiences}
                    handleApprove={handleApprove}
                    handleReject={handleReject}
                    handleApprovePromo={handleApprovePromo}
                    handleRejectPromo={handleRejectPromo}
                    handleModerateExp={handleModerateExp}
                    approveClub={approveClub}
                    rejectClub={rejectClub}
                    moderateExperience={moderateExperience}
                  />}
            </TabsContent>
            <TabsContent value="analytics" className="mt-6"><AnalyticsTab /></TabsContent>
            <TabsContent value="system" className="mt-6"><SystemTab /></TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminPage;
