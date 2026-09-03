import { useState } from "react";
import { CalendarPlus, Megaphone, Trash2, Ticket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard, SectionTitle } from "./GlassCard";
import {
  usePostVenueUpdate,
  useVenueEvents,
  useCreateVenueEvent,
  useDeleteVenueEvent,
} from "@/hooks/useVenueOwner";
import type { Club } from "@/hooks/useClubs";
import { cn } from "@/lib/utils";

const QUICK_UPDATES = [
  "Queue is moving fast — no wait right now 🚀",
  "2-for-1 cocktails for the next hour 🍸",
  "Cover charge is R100 tonight 🎟️",
  "DJ on deck now — the floor is packed 🔥",
];

export const VenueUpdatesTab = ({ venue }: { venue: Club }) => {
  const [update, setUpdate] = useState("");
  const post = usePostVenueUpdate();
  const { data: events, isLoading } = useVenueEvents(venue.id);
  const createEvent = useCreateVenueEvent();
  const deleteEvent = useDeleteVenueEvent();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");

  const submitUpdate = async () => {
    if (!update.trim()) return;
    try {
      await post.mutateAsync({ clubId: venue.id, content: update.trim(), country: venue.country });
      setUpdate("");
      toast.success("Live update posted to the public feed");
    } catch {
      toast.error("Could not post that update");
    }
  };

  const submitEvent = async () => {
    if (!title.trim() || !date) {
      toast.error("Add a title and a date");
      return;
    }
    try {
      await createEvent.mutateAsync({
        clubId: venue.id,
        title: title.trim(),
        description: desc.trim() || undefined,
        event_date: new Date(date).toISOString(),
        price_info: price.trim() || undefined,
        area: venue.area,
        address: venue.address,
        lat: venue.lat,
        lng: venue.lng,
        country: venue.country,
      });
      setTitle(""); setDate(""); setPrice(""); setDesc("");
      toast.success("Event published to the public feed");
    } catch {
      toast.error("Could not publish that event");
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <GlassCard glow="cyan">
        <SectionTitle
          icon={<Megaphone className="h-4 w-4" />}
          title="Post a live update"
          subtitle="Queue status, drink specials, cover charge — published as an Official post"
        />
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_UPDATES.map((q) => (
            <button
              key={q}
              onClick={() => setUpdate(q)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                update === q
                  ? "border-portal-cyan/60 bg-portal-cyan/15 text-portal-cyan"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground",
              )}
            >
              {q}
            </button>
          ))}
        </div>
        <Textarea
          value={update}
          onChange={(e) => setUpdate(e.target.value.slice(0, 300))}
          placeholder="What's happening at the door right now?"
          className="bg-white/5 border-white/10 min-h-[96px]"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">{update.length}/300</span>
          <Button onClick={submitUpdate} disabled={!update.trim() || post.isPending} className="gradient-primary text-primary-foreground font-semibold">
            <Megaphone className="h-4 w-4 mr-2" /> Publish update
          </Button>
        </div>
      </GlassCard>

      <GlassCard glow="pink">
        <SectionTitle icon={<CalendarPlus className="h-4 w-4" />} title="Create an event" subtitle="Appears on the public events feed" />
        <div className="space-y-3">
          <div>
            <Label htmlFor="ev-title" className="text-xs uppercase tracking-widest text-muted-foreground">Title</Label>
            <Input id="ev-title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5 bg-white/5 border-white/10" placeholder="Amapiano All Nighter" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ev-date" className="text-xs uppercase tracking-widest text-muted-foreground">Date & time</Label>
              <Input id="ev-date" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1.5 bg-white/5 border-white/10" />
            </div>
            <div>
              <Label htmlFor="ev-price" className="text-xs uppercase tracking-widest text-muted-foreground">Entry</Label>
              <Input id="ev-price" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1.5 bg-white/5 border-white/10" placeholder="R150" />
            </div>
          </div>
          <div>
            <Label htmlFor="ev-desc" className="text-xs uppercase tracking-widest text-muted-foreground">Details</Label>
            <Textarea id="ev-desc" value={desc} onChange={(e) => setDesc(e.target.value)} className="mt-1.5 bg-white/5 border-white/10" placeholder="Line-up, dress code, specials…" />
          </div>
          <Button onClick={submitEvent} disabled={createEvent.isPending} className="w-full bg-gradient-to-r from-portal-violet via-portal-pink to-portal-cyan text-white font-bold">
            <CalendarPlus className="h-4 w-4 mr-2" /> Publish event
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="lg:col-span-2">
        <SectionTitle icon={<Ticket className="h-4 w-4" />} title="Your events" subtitle="Manage what the public sees" />
        {isLoading ? (
          <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
        ) : !events?.length ? (
          <p className="text-sm text-muted-foreground">No events yet — publish your first one above.</p>
        ) : (
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.event_date).toLocaleString()} {e.price_info ? `· ${e.price_info}` : ""}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Delete ${e.title}`}
                  onClick={() => deleteEvent.mutate(e.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
};

export default VenueUpdatesTab;
