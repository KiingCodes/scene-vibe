import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, DollarSign, BarChart3, Ticket, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  MOCK_CAMPAIGNS, type SponsorAssetType, type SponsorshipCampaign,
} from "@/components/business/types";

const glass = "rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-2xl";
const money = (c: number) => `R${(c / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;

const ASSET_TYPES: SponsorAssetType[] = [
  "Hero Carousel Banner",
  "First Drink On Us Voucher",
  "Search Filter Tag",
  "Sponsored Push Alert",
];

const REDEMPTIONS = [
  { id: "r1", text: "User #4921 redeemed 'Free Heineken' at Konka Soweto", at: "1 min ago" },
  { id: "r2", text: "User #1180 redeemed 'Savanna Dry' at Kong Bar & Lounge", at: "3 min ago" },
  { id: "r3", text: "User #7742 redeemed 'Red Bull Shot' at Sky Villa", at: "8 min ago" },
  { id: "r4", text: "User #2298 redeemed 'Free Heineken' at Pabloz", at: "12 min ago" },
];

export default function SponsorshipsPage() {
  const [campaigns, setCampaigns] = useState<SponsorshipCampaign[]>(MOCK_CAMPAIGNS);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    brand: "", title: "", assetType: ASSET_TYPES[0] as SponsorAssetType,
    budget: "50000", start: "", end: "", venues: "",
  });

  const spent = campaigns.reduce((s, c) => s + c.spentCents, 0);
  const budget = campaigns.reduce((s, c) => s + c.budgetCents, 0);

  const create = () => {
    if (!form.brand || !form.title) return toast.error("Brand and campaign title are required");
    setCampaigns((cs) => [{
      id: crypto.randomUUID(), brand: form.brand, title: form.title, assetType: form.assetType,
      budgetCents: Number(form.budget || 0) * 100, spentCents: 0, impressions: 0, redemptions: 0,
      startDate: form.start || "TBC", endDate: form.end || "TBC",
      venues: form.venues ? form.venues.split(",").map((v) => v.trim()) : ["All venues"],
      status: "scheduled",
    }, ...cs]);
    setOpen(false);
    toast.success("Campaign created");
  };

  const Stat = ({ icon: Icon, label, value, tone }: any) => (
    <div className={`${glass} p-4`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-400">
        <Icon className="h-4 w-4" style={{ color: tone }} />{label}
      </div>
      <div className="mt-2 text-2xl font-bold" style={{ color: tone }}>{value}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 pb-28 text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="h-6 w-6 text-[#EC4899]" /> Brand Sponsorships
          </h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#EC4899] text-white hover:bg-[#EC4899]/90">
                <Plus className="mr-1.5 h-4 w-4" /> New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto border-white/10 bg-zinc-950/95 text-zinc-100 backdrop-blur-2xl">
              <DialogHeader><DialogTitle>Campaign Builder</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Brand name</Label><Input className="border-white/10 bg-white/5" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>
                <div><Label>Campaign title</Label><Input className="border-white/10 bg-white/5" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div>
                  <Label>Asset type</Label>
                  <select className="mt-1 h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm"
                    value={form.assetType} onChange={(e) => setForm({ ...form, assetType: e.target.value as SponsorAssetType })}>
                    {ASSET_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div><Label>Graphic banner</Label><Input type="file" accept="image/*" className="border-white/10 bg-white/5" /></div>
                <div><Label>Budget limit (R)</Label><Input type="number" className="border-white/10 bg-white/5" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Start date</Label><Input type="date" className="border-white/10 bg-white/5" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></div>
                  <div><Label>End date</Label><Input type="date" className="border-white/10 bg-white/5" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></div>
                </div>
                <div><Label>Targeted venues (comma separated)</Label><Input className="border-white/10 bg-white/5" value={form.venues} onChange={(e) => setForm({ ...form, venues: e.target.value })} placeholder="Konka Soweto, Sky Villa" /></div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={create} className="bg-[#8B5CF6] hover:bg-[#8B5CF6]/90">Launch campaign</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={Sparkles} label="Active campaigns" value={campaigns.filter((c) => c.status === "active").length} tone="#EC4899" />
          <Stat icon={DollarSign} label="Spent / budget" value={`${money(spent)}`} tone="#10B981" />
          <Stat icon={BarChart3} label="Impressions" value={campaigns.reduce((s, c) => s + c.impressions, 0).toLocaleString()} tone="#06B6D4" />
          <Stat icon={Ticket} label="Redemptions" value={campaigns.reduce((s, c) => s + c.redemptions, 0).toLocaleString()} tone="#F59E0B" />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {campaigns.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }} className={`${glass} p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{c.brand} — {c.title}</div>
                    <div className="text-xs text-zinc-500">{c.assetType} · {c.startDate} → {c.endDate}</div>
                  </div>
                  <Badge variant="outline" className="border-[#8B5CF6]/40 text-[#C4B5FD]">{c.status}</Badge>
                </div>
                <Progress value={c.budgetCents ? (c.spentCents / c.budgetCents) * 100 : 0} className="mt-3 h-1.5" />
                <div className="mt-2 flex justify-between text-xs text-zinc-500">
                  <span>{money(c.spentCents)} of {money(c.budgetCents)}</span>
                  <span>{c.impressions.toLocaleString()} impressions · {c.redemptions.toLocaleString()} redeemed</span>
                </div>
                <div className="mt-1 text-xs text-zinc-600">Venues: {c.venues.join(", ")}</div>
              </motion.div>
            ))}
          </div>

          <div className={`${glass} h-fit divide-y divide-white/5`}>
            <div className="flex items-center gap-2 p-4 text-xs uppercase tracking-widest text-zinc-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#10B981]" /> Live voucher redemptions
            </div>
            {REDEMPTIONS.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                <span className="text-zinc-300">{r.text}</span>
                <span className="shrink-0 text-xs text-zinc-500">{r.at}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}