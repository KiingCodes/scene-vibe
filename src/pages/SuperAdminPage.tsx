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
import {
  MOCK_CAMPAIGNS, MOCK_PAYOUTS, MOCK_STATS, MOCK_VENUES,
  type SecurityEvent, type VenueApproval, type VenueTier,
} from "@/components/business/types";

const money = (cents: number, cur = "R") =>
  `${cur}${(cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;

const glass = "rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-2xl";

const MOCK_EVENTS: SecurityEvent[] = [
  { id: "e1", kind: "door_scan", label: "LinePass scanned", detail: "Konka Soweto · pass #A91X", at: "12s ago" },
  { id: "e2", kind: "transaction", label: "LinePass purchase R180", detail: "Kong Bar & Lounge", at: "1 min ago" },
  { id: "e3", kind: "flag", label: "Account flagged", detail: "User #4210 · spam in chat", at: "4 min ago" },
  { id: "e4", kind: "door_scan", label: "Voucher redeemed", detail: "Free Heineken · Sky Villa", at: "6 min ago" },
  { id: "e5", kind: "transaction", label: "Ticket sale R350", detail: "The Venue Melville", at: "9 min ago" },
];

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
  const [venues, setVenues] = useState<VenueApproval[]>(MOCK_VENUES);
  const [linePassFee, setLinePassFee] = useState(15);
  const [ticketFee, setTicketFee] = useState(7);
  const [query, setQuery] = useState("");

  const pending = venues.filter((v) => v.status === "pending").length;
  const filtered = useMemo(
    () => venues.filter((v) => v.name.toLowerCase().includes(query.toLowerCase())),
    [venues, query],
  );

  const patch = (id: string, p: Partial<VenueApproval>, msg: string) => {
    setVenues((vs) => vs.map((v) => (v.id === id ? { ...v, ...p } : v)));
    toast.success(msg);
  };

  const totalImpressions = MOCK_CAMPAIGNS.reduce((s, c) => s + c.impressions, 0);
  const totalBudget = MOCK_CAMPAIGNS.reduce((s, c) => s + c.budgetCents, 0);

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
          <MetricCard icon={DollarSign} label="Platform GMV" value={money(MOCK_STATS.gmvCents)} sub="Last 30 days" tone="#10B981" />
          <MetricCard icon={Crown} label="SCENE Net Profit" value={money(MOCK_STATS.netProfitCents)} sub="Commissions + SaaS" tone="#F59E0B" />
          <MetricCard icon={Building2} label="Active Venues" value={`${MOCK_STATS.activeVenues}`} sub={`${pending} pending approvals`} tone="#06B6D4" />
          <MetricCard icon={Zap} label="Checked-in Now" value={MOCK_STATS.checkedInNow.toLocaleString()} sub="Live partygoers" tone="#EC4899" />
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
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="text-left text-xs uppercase tracking-widest text-zinc-500">
                    <tr><th className="py-2">Venue</th><th>Location</th><th>Tier</th><th>Status</th><th className="text-right">Actions</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map((v) => (
                      <tr key={v.id} className="border-t border-white/5">
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
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-[#10B981]"
                              onClick={() => patch(v.id, { status: "active" }, `${v.name} approved`)}>
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-[#EC4899]"
                              onClick={() => patch(v.id, { status: "suspended" }, `${v.name} suspended`)}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-[#06B6D4]"
                              onClick={() => patch(v.id, { verified: !v.verified }, `Verified badge ${v.verified ? "removed" : "granted"}`)}>
                              ✦
                            </Button>
                            <select
                              aria-label={`Override tier for ${v.name}`}
                              value={v.tier}
                              onChange={(e) => patch(v.id, { tier: e.target.value as VenueTier }, "Tier overridden")}
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
            </div>
          </TabsContent>

          <TabsContent value="sponsor" className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard icon={Sparkles} label="Active campaigns" value={`${MOCK_CAMPAIGNS.filter(c => c.status === "active").length}`} tone="#EC4899" />
              <MetricCard icon={BarChart3} label="Impressions" value={totalImpressions.toLocaleString()} tone="#06B6D4" />
              <MetricCard icon={DollarSign} label="Voucher budget" value={money(totalBudget)} tone="#10B981" />
              <MetricCard icon={Ticket} label="Redemptions" value={MOCK_CAMPAIGNS.reduce((s, c) => s + c.redemptions, 0).toLocaleString()} tone="#F59E0B" />
            </div>
            <div className={`${glass} divide-y divide-white/5`}>
              {MOCK_CAMPAIGNS.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <div className="font-semibold">{c.brand} — {c.title}</div>
                    <div className="text-xs text-zinc-500">{c.assetType} · {c.venues.join(", ")}</div>
                  </div>
                  <div className="text-right text-xs text-zinc-400">
                    <div>{money(c.spentCents)} / {money(c.budgetCents)}</div>
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
                  <span>LinePass commission</span><span className="text-[#06B6D4]">{linePassFee}%</span>
                </div>
                <Slider value={[linePassFee]} onValueChange={([v]) => setLinePassFee(v)} min={0} max={40} step={1} />
              </div>
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>Ticket service fee</span><span className="text-[#10B981]">{ticketFee}%</span>
                </div>
                <Slider value={[ticketFee]} onValueChange={([v]) => setTicketFee(v)} min={0} max={25} step={1} />
              </div>
              <Button onClick={() => toast.success("Global split rules saved")} className="bg-[#10B981] text-black hover:bg-[#10B981]/90">
                Save split rules
              </Button>
            </div>
            <div className={`${glass} divide-y divide-white/5`}>
              <div className="p-4 text-xs uppercase tracking-widest text-zinc-500">Payout history</div>
              {MOCK_PAYOUTS.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 text-sm">
                  <div>
                    <div className="font-medium">{p.venue}</div>
                    <div className="text-xs text-zinc-500">{p.date} · SCENE cut {money(p.sceneCutCents)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-[#10B981]">{money(p.grossCents)}</div>
                    <div className="text-xs text-zinc-500">{p.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="security" className="mt-4 space-y-3">
            <div className={`${glass} p-4`}>
              <div className="flex gap-2">
                <Input placeholder="Search user account…" className="h-9 border-white/10 bg-white/5" />
                <Button variant="outline" className="border-[#EC4899]/40 text-[#EC4899]"
                  onClick={() => toast.success("Account flagged & banned")}>
                  <Ban className="mr-1.5 h-4 w-4" /> Ban / Flag
                </Button>
              </div>
            </div>
            <div className={`${glass} divide-y divide-white/5`}>
              {MOCK_EVENTS.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-4 text-sm">
                  <div>
                    <div className="font-medium">{e.label}</div>
                    <div className="text-xs text-zinc-500">{e.detail}</div>
                  </div>
                  <span className="text-xs text-zinc-500">{e.at}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}