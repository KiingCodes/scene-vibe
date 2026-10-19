import { useState } from "react";
import { CalendarDays, CalendarPlus, Clock3, Megaphone, Trash2, Ticket } from "lucide-react";
import { format } from "date-fns";
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
import { LogoSkeleton } from "@/components/BrandedSkeleton";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { BroadcastChannelSelect } from './BroadcastChannelSelect';

const QUICK_UPDATES = [
  "Queue is moving fast — no wait right now 🚀",
  "2-for-1 cocktails for the next hour 🍸",
  "Cover charge is R100 tonight 🎟️",
  "DJ on deck now — the floor is packed 🔥",
];

export const VenueUpdatesTab = ({ venue }: { venue: Club }) => {
  const [update, setUpdate] = useState("");
  const [channelId, setChannelId] = useState('live-clubs');
  const post = usePostVenueUpdate();
  const { data: events, isLoading } = useVenueEvents(venue.id);
  const createEvent = useCreateVenueEvent();
  const deleteEvent = useDeleteVenueEvent();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date>();
  const [eventTime, setEventTime] = useState("21:00");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");

  const submitUpdate = async () => {
    if (!update.trim()) return;
    try {
      await post.mutateAsync({ clubId: venue.id, content: update.trim(), country: venue.country, channelId });
      setUpdate("");
      toast.success("Live update posted to the public feed");
    } catch {
      toast.error("Could not post that update");
    }
  };

  const submitEvent = async () => {
    if (!title.trim() || !date || !eventTime) {
      toast.error("Add a title and a date");
      return;
    }
    try {
      const eventDate = new Date(date);
      const [hours, minutes] = eventTime.split(":").map(Number);
      eventDate.setHours(hours, minutes, 0, 0);
      await createEvent.mutateAsync({
        clubId: venue.id,
        title: title.trim(),
        description: desc.trim() || undefined,
        event_date: eventDate.toISOString(),
        price_info: price.trim() || undefined,
        area: venue.area,
        address: venue.address,
        lat: venue.lat,
        lng: venue.lng,
        country: venue.country,
      });
      setTitle(""); setDate(undefined); setEventTime("21:00"); setPrice(""); setDesc("");
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
                  ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100"
                  : "border-white/10 bg-slate-950/50 text-slate-400 hover:border-white/20 hover:text-white",
              )}
            >
              {q}
            </button>
          ))}
        </div>
        <BroadcastChannelSelect value={channelId} onChange={setChannelId} disabled={post.isPending} />
        <Textarea
          value={update}
          onChange={(e) => setUpdate(e.target.value.slice(0, 300))}
          placeholder="What's happening at the door right now?"
          className="min-h-[96px] border-white/10 bg-slate-950/70 text-slate-100 placeholder:text-slate-500"
        />
        {post.isPending && (
          <LogoSkeleton label="Publishing update…" size={24} className="mt-3 border-0 bg-transparent py-1" />
        )}
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-[11px] text-muted-foreground">{update.length}/300</span>
          <Button onClick={submitUpdate} disabled={!update.trim() || post.isPending} className="bg-gradient-to-r from-cyan-500 via-purple-600 to-fuchsia-500 font-semibold text-white shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:scale-100">
            {post.isPending ? <LogoSkeleton label="" size={18} className="border-0 bg-transparent p-0" /> : <Megaphone className="mr-2 h-4 w-4" />} Publish update
          </Button>
        </div>
      </GlassCard>

      <GlassCard glow="pink">
        <SectionTitle icon={<CalendarPlus className="h-4 w-4" />} title="Create an event" subtitle="Appears on the public events feed" />
        <div className="space-y-3">
          <div>
            <Label htmlFor="ev-title" className="text-xs uppercase tracking-widest text-muted-foreground">Title</Label>
            <Input id="ev-title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5 border-white/10 bg-slate-950/70 text-slate-100 placeholder:text-slate-500" placeholder="Amapiano All Nighter" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="ev-date" className="text-xs uppercase tracking-widest text-muted-foreground">Date & time</Label>
              <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_minmax(7rem,0.7fr)] gap-2">
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="ev-date"
                      type="button"
                      variant="outline"
                      className="h-11 min-w-0 justify-start gap-2 overflow-hidden border-white/10 bg-slate-950/70 px-3 text-left font-normal text-slate-200 hover:border-cyan-300/30 hover:bg-slate-900"
                    >
                      <CalendarDays className="h-4 w-4 shrink-0 text-cyan-300" />
                      <span className="truncate">{date ? format(date, "EEE, MMM d, yyyy") : "Choose date"}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-auto border border-white/10 bg-slate-950/95 p-2 text-slate-100 shadow-2xl backdrop-blur-2xl"
                  >
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(selectedDate) => {
                        setDate(selectedDate);
                        if (selectedDate) setDatePickerOpen(false);
                      }}
                      className="text-slate-100"
                      classNames={{
                        caption_label: "text-sm font-semibold text-slate-100",
                        head_cell: "w-9 rounded-md text-[0.8rem] font-normal text-slate-500",
                        nav_button: "h-8 w-8 border-white/10 bg-slate-900 p-0 text-slate-300 hover:bg-slate-800 hover:text-white",
                        day: "h-9 w-9 rounded-lg p-0 font-normal text-slate-300 hover:bg-cyan-500/15 hover:text-cyan-100",
                        day_selected: "bg-cyan-500 font-bold text-slate-950 hover:bg-cyan-400 hover:text-slate-950 focus:bg-cyan-500 focus:text-slate-950",
                        day_today: "bg-white/10 text-cyan-200",
                        day_outside: "text-slate-600 opacity-50",
                        day_disabled: "text-slate-700 opacity-40",
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <div className="relative">
                  <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                  <Input
                    aria-label="Event time"
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="h-11 border-white/10 bg-slate-950/70 pl-9 text-slate-100 [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="ev-price" className="text-xs uppercase tracking-widest text-muted-foreground">Entry fee (ZAR)</Label>
              <Input id="ev-price" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1.5 border-white/10 bg-slate-950/70 text-slate-100 placeholder:text-slate-500" placeholder="R150" />
            </div>
          </div>
          <div>
            <Label htmlFor="ev-desc" className="text-xs uppercase tracking-widest text-muted-foreground">Details</Label>
            <Textarea id="ev-desc" value={desc} onChange={(e) => setDesc(e.target.value)} className="mt-1.5 border-white/10 bg-slate-950/70 text-slate-100 placeholder:text-slate-500" placeholder="Line-up, dress code, specials…" />
          </div>
          {createEvent.isPending && (
            <LogoSkeleton label="Publishing event…" size={24} className="border-0 bg-transparent py-1" />
          )}
          <Button onClick={submitEvent} disabled={createEvent.isPending} className="w-full bg-gradient-to-r from-cyan-500 via-purple-600 to-fuchsia-500 font-bold text-white shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:scale-100">
            {createEvent.isPending ? <LogoSkeleton label="" size={18} className="border-0 bg-transparent p-0" /> : <CalendarPlus className="mr-2 h-4 w-4" />} Publish event
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="lg:col-span-2">
        <SectionTitle icon={<Ticket className="h-4 w-4" />} title="Your events" subtitle="Manage what the public sees" />
        {isLoading ? (
          <LogoSkeleton label="Loading events…" size={32} />
        ) : !events?.length ? (
          <p className="text-sm text-muted-foreground">No events yet — publish your first one above.</p>
        ) : (
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2.5">
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
