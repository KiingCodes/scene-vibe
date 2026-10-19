import { useState } from "react";
import { Megaphone, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard, SectionTitle } from "./GlassCard";
import { useVenueAnnouncements, usePostAnnouncement, useDeleteAnnouncement } from "@/hooks/useVenueOwner";
import type { Club } from "@/hooks/useClubs";
import { cn } from "@/lib/utils";
import { LogoSkeleton } from "@/components/BrandedSkeleton";

import { BroadcastChannelSelect } from './BroadcastChannelSelect';

const PRESETS = ["Free entry before 11 PM", "DJ set starting now", "2-for-1 cocktails until midnight", "No queue right now"];
const DURATIONS = [1, 3, 6, 12];

const timeLeft = (iso: string) => {
  const mins = Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 60000));
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m left` : `${mins}m left`;
};

export const AnnouncementsCard = ({ venue }: { venue: Club }) => {
  const [text, setText] = useState("");
  const [hours, setHours] = useState(3);
  const [channelId, setChannelId] = useState('live-clubs');
  const { data: items, isLoading } = useVenueAnnouncements(venue.id);
  const post = usePostAnnouncement();
  const del = useDeleteAnnouncement();

  const submit = () => {
    if (!text.trim()) return;
    post.mutate(
      { clubId: venue.id, content: text.trim(), hours, channelId },
      {
        onSuccess: () => { setText(""); toast.success("Announcement is live"); },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  };

  return (
    <GlassCard glow="pink" className="lg:col-span-2">
      <SectionTitle icon={<Megaphone className="h-4 w-4" />} title="Live Announcements & Specials" subtitle="Shown on your venue page until they expire" />
      {post.isPending && (
        <LogoSkeleton label="Publishing announcement…" size={24} className="mb-3 border-0 bg-transparent py-1" />
      )}
      <div className="mb-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button key={p} onClick={() => setText(p)} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium transition-all", text === p ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-slate-950/50 text-slate-400 hover:border-white/20 hover:text-white")}>
            {p}
          </button>
        ))}
      </div>
      <BroadcastChannelSelect value={channelId} onChange={setChannelId} disabled={post.isPending} />
      <Textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 200))} placeholder="What's the special tonight?" className="min-h-[80px] border-white/10 bg-white/5" />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          {DURATIONS.map((h) => (
            <button key={h} onClick={() => setHours(h)} aria-pressed={hours === h} className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold", hours === h ? "border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]" : "border-white/10 bg-slate-950/50 text-slate-400")}>
              {h}h
            </button>
          ))}
        </div>
        <Button onClick={submit} disabled={!text.trim() || post.isPending} className="bg-gradient-to-r from-cyan-500 via-purple-600 to-fuchsia-500 font-semibold text-white shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]">
          {post.isPending ? <LogoSkeleton label="" size={18} className="border-0 bg-transparent p-0" /> : <Megaphone className="mr-2 h-4 w-4" />} Post announcement
        </Button>
      </div>

      <div className="mt-5 space-y-2">
        {isLoading ? (
          <LogoSkeleton label="Loading announcements…" size={32} />
        ) : !items?.length ? (
          <p className="text-sm text-muted-foreground">No live announcements right now.</p>
        ) : (
          items.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{a.content}</p>
                <p className="text-[11px] text-muted-foreground">{timeLeft(a.expires_at)}</p>
              </div>
              <Button size="icon" variant="ghost" aria-label="Remove announcement" onClick={() => del.mutate(a.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
};

export default AnnouncementsCard;
