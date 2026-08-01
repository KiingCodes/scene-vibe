import { useState } from "react";
import { ImagePlus, Sparkles, Plus, Trash2, CalendarDays, UploadCloud } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GlassCard, SectionTitle } from "./GlassCard";
import { LineupSlot, MediaSlot, MenuItem } from "./types";
import { cn } from "@/lib/utils";

const initialMedia: MediaSlot[] = [
  { id: "hero", label: "Hero cover photo", hint: "1920×1080 · JPG", filled: true },
  { id: "clip", label: "Vibe preview clip", hint: "15s · MP4", filled: false },
  { id: "flyer", label: "Promo flyer", hint: "1080×1350 · PNG", filled: false },
  { id: "gallery", label: "Gallery shot", hint: "Up to 8 images", filled: false },
];

const initialMenu: MenuItem[] = [
  { id: "m1", name: "House Double", category: "Drinks", price: 65 },
  { id: "m2", name: "General Entry", category: "Entry", price: 150 },
  { id: "m3", name: "Gold Table (8 pax)", category: "VIP Table", price: 4500 },
];

const initialLineup: LineupSlot[] = [
  { id: "l1", day: "Friday", artist: "DJ Nkosi", time: "22:00", genre: "Amapiano" },
  { id: "l2", day: "Saturday", artist: "Kiing B2B Zaza", time: "23:30", genre: "Afro House" },
  { id: "l3", day: "Sunday", artist: "Sunset Sessions", time: "16:00", genre: "Deep House" },
];

export const ContentManagerTab = () => {
  const [media, setMedia] = useState<MediaSlot[]>(initialMedia);
  const [menu, setMenu] = useState<MenuItem[]>(initialMenu);
  const [lineup, setLineup] = useState<LineupSlot[]>(initialLineup);
  const [draft, setDraft] = useState<{ name: string; category: MenuItem["category"]; price: string }>({
    name: "",
    category: "Drinks",
    price: "",
  });

  const addMenuItem = () => {
    if (!draft.name || !draft.price) return;
    setMenu((prev) => [...prev, { id: crypto.randomUUID(), name: draft.name, category: draft.category, price: Number(draft.price) }]);
    setDraft({ name: "", category: "Drinks", price: "" });
    toast.success("Menu item added");
  };

  const updateLineup = (id: string, patch: Partial<LineupSlot>) =>
    setLineup((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <GlassCard glow="violet" className="lg:col-span-2">
        <SectionTitle icon={<ImagePlus className="h-4 w-4" />} title="Media Upload Grid" subtitle="Drag & drop your covers, clips and flyers" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {media.map((slot) => (
            <button
              key={slot.id}
              onClick={() => {
                setMedia((prev) => prev.map((m) => (m.id === slot.id ? { ...m, filled: !m.filled } : m)));
                toast.success(slot.filled ? `${slot.label} removed` : `${slot.label} uploaded`);
              }}
              className={cn(
                "group aspect-[4/5] rounded-xl border-2 border-dashed p-3 text-left transition-all flex flex-col justify-between",
                slot.filled
                  ? "border-portal-cyan/50 bg-portal-cyan/10"
                  : "border-white/15 bg-white/5 hover:border-portal-violet/60 hover:bg-portal-violet/10",
              )}
            >
              <UploadCloud className={cn("h-5 w-5", slot.filled ? "text-portal-cyan" : "text-muted-foreground")} />
              <span>
                <span className="block text-xs font-semibold text-foreground">{slot.label}</span>
                <span className="block text-[10px] text-muted-foreground">{slot.filled ? "Uploaded · tap to replace" : slot.hint}</span>
              </span>
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard glow="pink">
        <SectionTitle icon={<Sparkles className="h-4 w-4" />} title="Digital Menu Builder" subtitle="Drinks, cover charges and VIP tiers" />

        <ul className="space-y-2 mb-4">
          {menu.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-foreground truncate">{item.name}</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{item.category}</span>
              </span>
              <span className="text-sm font-bold text-portal-cyan">R{item.price}</span>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Remove ${item.name}`}
                onClick={() => setMenu((prev) => prev.filter((m) => m.id !== item.id))}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Input
            placeholder="Item name"
            aria-label="Menu item name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="bg-white/5 border-white/10"
          />
          <Input
            placeholder="Price"
            aria-label="Menu item price"
            type="number"
            value={draft.price}
            onChange={(e) => setDraft({ ...draft, price: e.target.value })}
            className="w-24 bg-white/5 border-white/10"
          />
          <select
            aria-label="Menu item category"
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value as MenuItem["category"] })}
            className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-foreground"
          >
            <option value="Drinks">Drinks</option>
            <option value="Entry">Entry</option>
            <option value="VIP Table">VIP Table</option>
          </select>
          <Button onClick={addMenuItem} className="bg-portal-violet/20 text-portal-violet border border-portal-violet/40 hover:bg-portal-violet/30">
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </GlassCard>

      <GlassCard glow="cyan">
        <SectionTitle icon={<CalendarDays className="h-4 w-4" />} title="Weekend Lineup" subtitle="Friday through Sunday set times" />
        <div className="space-y-3">
          {lineup.map((slot) => (
            <div key={slot.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-portal-pink">{slot.day}</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Artist</Label>
                  <Input
                    value={slot.artist}
                    onChange={(e) => updateLineup(slot.id, { artist: e.target.value })}
                    className="mt-1 bg-white/5 border-white/10"
                  />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Set time</Label>
                  <Input
                    type="time"
                    value={slot.time}
                    onChange={(e) => updateLineup(slot.id, { time: e.target.value })}
                    className="mt-1 bg-white/5 border-white/10"
                  />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Genre</Label>
                  <Input
                    value={slot.genre}
                    onChange={(e) => updateLineup(slot.id, { genre: e.target.value })}
                    className="mt-1 bg-white/5 border-white/10"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};