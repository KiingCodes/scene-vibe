import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert, Building2, Sparkles, DollarSign, CheckCircle2, XCircle,
  Sliders, BarChart3, Zap, Ticket, Crown, Search, Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import type { VenueTier } from "@/components/business/types";
import { useAdminStats, useAdminUsers, useAdminUserActions, useAdminAuditLog } from "@/hooks/useAdminStats";
import { useVenueClaims, useModerateClaim } from "@/hooks/useVenueClaims";
import {
  useCampaigns, usePlatformFees, useRevenue, useSaveFees,
  useUpsertSubscription, useVenueSubscriptions,
} from "@/hooks/useBusinessAdmin";

const money = (cents: number, cur = "R") =>
  `${cur}${(cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;

const glass = "rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-2xl";

const ago = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.round(m / 60)}h ago`;
};

const MetricCard = ({ icon: Icon, label, value, sub, tone }: {
  icon: any; label: string; value: string; sub?: string; tone: string;
}) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`${glass} p-4`}>
    <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-400">
      <Icon className="h-4 w-4" style={{ color: tone }} />
      {label}
    </div>
    <div className="mt-2 text-2xl font-bold tracking-tight" style={{ color: tone }}>{value}</div>
    {sub && <div className="mt-1 text-xs text-zinc-500">{sub}</div>}
  </motion.div>
);

const TierBadge = ({ tier }: { tier: VenueTier }) => {
  const map: Record<VenueTier, string> = {
    basic: "border-white/15 text-zinc-300",
    pro: "border-[#8B5CF6]/50 text-[#C4B5FD]",
    enterprise: "border-[#F59E0B]/50 text-[#FCD34D]",
  };
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] uppercase ${map[tier]}`}>{tier}</span>;
};

export default function SuperAdminPage() {
  const [query, setQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");

  const { data: stats } = useAdminStats();
  const { data: claims = [], isLoading: claimsLoading } = useVenueClaims("all");
  const { data: subs = [] } = useVenueSubscriptions();
  const { data: campaigns = [] } = useCampaigns();
  const { data: fees } = usePlatformFees();
  const { data: revenue } = useRevenue();
  const { data: users = [] } = useAdminUsers(userQuery);
  const { data: audit = [] } = useAdminAuditLog();

  const moderateClaim = useModerateClaim();
  const upsertSub = useUpsertSubscription();
  const saveFees = useSaveFees();
  const actions = useAdminUserActions();

  const [linePassFee, setLinePassFee] = useState<number | null>(null);
  const [ticketFee, setTicketFee] = useState<number | null>(null);
  const lpFee = linePassFee ?? fees?.linePassFee ?? 15;
  const tkFee = ticketFee ?? fees?.ticketFee ?? 7;

  const subByClaim = useMemo(
    () => new Map(subs.map((s) => [s.claim_id ?? s.id, s])),
    [subs],
  );

  const venues = useMemo(() => claims.map((c) => {
    const sub = subByClaim.get(c.id);
    const status = sub?.status
      ?? (c.status === "approved" ? "active" : c.status === "rejected" ? "suspended" : "pending");
    return {
      claimId: c.id,
      userId: c.user_id,
      subId: sub?.id,
      name: c.venue_name,
      location: c.address || "—",
      tier: (sub?.tier ?? "basic") as VenueTier,
      status,
      verified: sub?.verified ?? false,
    };
  }), [claims, subByClaim]);

  const pending = venues.filter((v) => v.status === "pending").length;
  const filtered = useMemo(
    () => venues.filter((v) => v.name.toLowerCase().includes(query.toLowerCase())),
    [venues, query],
  );

  const gmvCents = revenue?.gmvCents ?? 0;
  const netProfitCents = Math.round(gmvCents * (lpFee / 100));

  const setVenue = async (
    v: (typeof venues)[number],
    patch: { status?: string; tier?: VenueTier; verified?: boolean },
    msg: string,
  ) => {
    try {
      if (patch.status === "active" || patch.status === "suspended") {
        await moderateClaim.mutateAsync({
          id: v.claimId,
          status: patch.status === "active" ? "approved" : "rejected",
        });
      }
      await upsertSub.mutateAsync({
        id: v.subId, claim_id: v.claimId, user_id: v.userId, venue_name: v.name,
        tier: patch.tier, status: patch.status, verified: patch.verified,
      });
      toast.success(msg);
    } catch (e: any) {
      toast.error(e.message ?? "Action failed");
    }
  };

  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalBudget = campaigns.reduce((s, c) => s + c.budget_cents, 0);

  return (
    <div className="min-h-screen bg-zinc-950 pb-28 text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <ShieldAlert className="h-6 w-6 text-[#EC4899]" /> God-Mode Portal
            </h1>
            <p className="text-xs text-zinc-500">Owner-level control over venues, money and safety.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="border-white/10 bg-white/5">
              <Link to="/admin/sponsorships">Sponsorships</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="border-white/10 bg-white/5">
              <Link to="/admin">Command Center</Link>
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard icon={DollarSign} label="Platform GMV" value={money(gmvCents)} sub="Approved promotions" tone="#10B981" />
          <MetricCard icon={Crown} label="SCENE Net Profit" value={money(netProfitCents)} sub={`${lpFee}% commission`} tone="#F59E0B" />
          <MetricCard icon={Building2} label="Active Venues" value={`${stats?.clubs ?? 0}`} sub={`${pending} pending approvals`} tone="#06B6D4" />
          <MetricCard icon={Zap} label="Checked-in Now" value={(stats?.pullingNow ?? 0).toLocaleString()} sub="Live partygoers" tone="#EC4899" />
        </div>

        <Tabs defaultValue="venues" className="mt-6">
          <TabsList className="w-full justify-start overflow-x-auto border border-white/10 bg-zinc-900/70 backdrop-blur-2xl">
            <TabsTrigger value="venues"><Building2 className="mr-1.5 h-4 w-4" />Venues</TabsTrigger>
            <TabsTrigger value="sponsor"><Sparkles className="mr-1.5 h-4 w-4" />Sponsorships</TabsTrigger>
            <TabsTrigger value="finance"><Sliders className="mr-1.5 h-4 w-4" />Financial</TabsTrigger>
            <TabsTrigger value="security"><ShieldAlert className="mr-1.5 h-4 w-4" />Security</TabsTrigger>
          </TabsList>

          <TabsContent value="venues" className="mt-4">
            <div className={`${glass} p-4`}>
              <div className="mb-3 flex items-center gap-2">
                <Search className="h-4 w-4 text-zinc-500" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search venues…"
                  className="h-9 border-white/10 bg-white/5" />
              </div>
              {claimsLoading ? (
                <div className="py-10 text-center text-sm text-zinc-500">Loading venues…</div>
              ) : filtered.length === 0 ? (
                <div className="py-10 text-center text-sm text-zinc-500">No venue claims yet.</div>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="text-left text-xs uppercase tracking-widest text-zinc-500">
                    <tr><th className="py-2">Venue</th><th>Location</th><th>Tier</th><th>Status</th><th className="text-right">Actions</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map((v) => (
                      <tr key={v.claimId} className="border-t border-white/5">
                        <td className="py-3 font-medium">
                          {v.name}
                          {v.verified && <span className="ml-2 text-[11px] text-[#06B6D4]">✦ Verified Neon</span>}
                        </td>
                        <td className="text-zinc-400">{v.location}</td>
                        <td><TierBadge tier={v.tier} /></td>
                        <td>
                          <Badge variant="outline" className={
                            v.status === "active" ? "border-[#10B981]/40 text-[#10B981]"
                              : v.status === "pending" ? "border-[#F59E0B]/40 text-[#F59E0B]"
                              : "border-[#EC4899]/40 text-[#EC4899]"}>{v.status}</Badge>
                        </td>
                        <td className="py-2">
                          <div className="flex flex-wrap justify-end gap-1.5">
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-[#10B981]" aria-label={`Approve ${v.name}`}
                              onClick={() => setVenue(v, { status: "active" }, `${v.name} approved`)}>
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-[#EC4899]" aria-label={`Suspend ${v.name}`}
                              onClick={() => setVenue(v, { status: "suspended" }, `${v.name} suspended`)}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-[#06B6D4]" aria-label={`Toggle verified badge for ${v.name}`}
                              onClick={() => setVenue(v, { verified: !v.verified }, `Verified badge ${v.verified ? "removed" : "granted"}`)}>
                              ✦
                            </Button>
                            <select
                              aria-label={`Override tier for ${v.name}`}
                              value={v.tier}
                              onChange={(e) => setVenue(v, { tier: e.target.value as VenueTier }, "Tier overridden")}
                              className="h-7 rounded-md border border-white/10 bg-white/5 px-1 text-xs">
                              <option value="basic">basic</option>
                              <option value="pro">pro</option>
                              <option value="enterprise">enterprise</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sponsor" className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard icon={Sparkles} label="Active campaigns" value={`${campaigns.filter(c => c.status === "active").length}`} tone="#EC4899" />
              <MetricCard icon={BarChart3} label="Impressions" value={totalImpressions.toLocaleString()} tone="#06B6D4" />
              <MetricCard icon={DollarSign} label="Voucher budget" value={money(totalBudget)} tone="#10B981" />
              <MetricCard icon={Ticket} label="Redemptions" value={campaigns.reduce((s, c) => s + c.redemptions, 0).toLocaleString()} tone="#F59E0B" />
            </div>
            <div className={`${glass} divide-y divide-white/5`}>
              {campaigns.length === 0 && (
                <div className="p-6 text-center text-sm text-zinc-500">No campaigns yet — create one below.</div>
              )}
              {campaigns.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <div className="font-semibold">{c.brand} — {c.title}</div>
                    <div className="text-xs text-zinc-500">{c.asset_type} · {(c.venues || []).join(", ") || "All venues"}</div>
                  </div>
                  <div className="text-right text-xs text-zinc-400">
                    <div>{money(c.spent_cents)} / {money(c.budget_cents)}</div>
                    <div>{c.impressions.toLocaleString()} impressions</div>
                  </div>
                </div>
              ))}
            </div>
            <Button asChild className="w-full bg-[#EC4899] text-white hover:bg-[#EC4899]/90">
              <Link to="/admin/sponsorships">Create Global Campaign</Link>
            </Button>
          </TabsContent>

          <TabsContent value="finance" className="mt-4 space-y-3">
            <div className={`${glass} space-y-6 p-5`}>
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>LinePass commission</span><span className="text-[#06B6D4]">{lpFee}%</span>
                </div>
                <Slider value={[lpFee]} onValueChange={([v]) => setLinePassFee(v)} min={0} max={40} step={1} />
              </div>
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>Ticket service fee</span><span className="text-[#10B981]">{tkFee}%</span>
                </div>
                <Slider value={[tkFee]} onValueChange={([v]) => setTicketFee(v)} min={0} max={25} step={1} />
              </div>
              <Button
                disabled={saveFees.isPending}
                onClick={() => saveFees.mutateAsync({ linePassFee: lpFee, ticketFee: tkFee })
                  .then(() => toast.success("Global split rules saved"))
                  .catch((e) => toast.error(e.message))}
                className="bg-[#10B981] text-black hover:bg-[#10B981]/90">
                Save split rules
              </Button>
            </div>
            <div className={`${glass} divide-y divide-white/5`}>
              <div className="p-4 text-xs uppercase tracking-widest text-zinc-500">Payout history</div>
              {(revenue?.rows ?? []).length === 0 && (
                <div className="p-6 text-center text-sm text-zinc-500">No transactions yet.</div>
              )}
              {(revenue?.rows ?? []).slice(0, 20).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-4 text-sm">
                  <div>
                    <div className="font-medium capitalize">{String(p.type).replace(/_/g, " ")}</div>
                    <div className="text-xs text-zinc-500">
                      {new Date(p.created_at).toLocaleDateString()} · SCENE cut {money(Math.round((p.amount_cents || 0) * (lpFee / 100)))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-[#10B981]">{money(p.amount_cents || 0)}</div>
                    <div className="text-xs text-zinc-500">{p.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="security" className="mt-4 space-y-3">
            <div className={`${glass} p-4`}>
              <div className="flex gap-2">
                <Input value={userQuery} onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Search user account…" className="h-9 border-white/10 bg-white/5" />
              </div>
              <div className="mt-3 divide-y divide-white/5">
                {userQuery && users.length === 0 && (
                  <div className="py-4 text-center text-sm text-zinc-500">No users match “{userQuery}”.</div>
                )}
                {users.slice(0, 12).map((u: any) => (
                  <div key={u.user_id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div>
                      <div className="font-medium">{u.username || "Anonymous"}</div>
                      <div className="text-xs text-zinc-500">
                        {u.is_banned ? "banned" : u.is_blocked ? "blocked" : "active"} · {u.warning_count ?? 0} warnings
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" className="h-7 border-white/10 text-xs"
                        onClick={() => actions.setBlocked.mutateAsync({ userId: u.user_id, blocked: !u.is_blocked })
                          .then(() => toast.success(u.is_blocked ? "Unblocked" : "Blocked"))
                          .catch((e) => toast.error(e.message))}>
                        {u.is_blocked ? "Unblock" : "Block"}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 border-[#EC4899]/40 text-xs text-[#EC4899]"
                        onClick={() => actions.setBanned.mutateAsync({ userId: u.user_id, banned: !u.is_banned })
                          .then(() => toast.success(u.is_banned ? "Ban lifted" : "Account banned"))
                          .catch((e) => toast.error(e.message))}>
                        <Ban className="mr-1 h-3.5 w-3.5" />{u.is_banned ? "Lift ban" : "Ban"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={`${glass} divide-y divide-white/5`}>
              <div className="p-4 text-xs uppercase tracking-widest text-zinc-500">Admin audit trail</div>
              {audit.length === 0 && <div className="p-6 text-center text-sm text-zinc-500">No admin actions logged yet.</div>}
              {audit.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between p-4 text-sm">
                  <div>
                    <div className="font-medium capitalize">{String(e.action).replace(/_/g, " ")}</div>
                    <div className="text-xs text-zinc-500">
                      {e.target_user_id ? `target ${String(e.target_user_id).slice(0, 8)}` : "platform action"}
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500">{ago(e.created_at)}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
