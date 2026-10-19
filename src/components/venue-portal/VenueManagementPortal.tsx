import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Zap, Sparkles, TrendingUp, Megaphone, Video } from "lucide-react";
import { PortalHeader } from "./PortalHeader";
import { LiveCommandTab } from "./LiveCommandTab";
import { ContentManagerTab } from "./ContentManagerTab";
import { AnalyticsTab } from "./AnalyticsTab";
import { VenueUpdatesTab } from "./VenueUpdatesTab";
import { OwnerLiveStatusCard } from "./OwnerLiveStatusCard";
import { AnnouncementsCard } from "./AnnouncementsCard";
import { VenueProfileEditor } from "./VenueProfileEditor";
import NightReplayReview from "./NightReplayReview";
import { PortalMode, VenueStatus } from "./types";
import type { Club } from "@/hooks/useClubs";
import { cn } from "@/lib/utils";

type TabId = "live" | "updates" | "content" | "replays" | "analytics";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "live", label: "Live Command", icon: <Zap className="h-4 w-4" /> },
  { id: "updates", label: "Updates & Events", icon: <Megaphone className="h-4 w-4" /> },
  { id: "content", label: "Profile & Content", icon: <Sparkles className="h-4 w-4" /> },
  { id: "replays", label: "Replay Review", icon: <Video className="h-4 w-4" /> },
  { id: "analytics", label: "Analytics", icon: <TrendingUp className="h-4 w-4" /> },
];

interface VenueManagementPortalProps {
  venueName?: string;
  venue?: Club;
}

export const VenueManagementPortal = ({ venueName, venue }: VenueManagementPortalProps) => {
  const [mode, setMode] = useState<PortalMode>("live");
  const [tab, setTab] = useState<TabId>("live");
  const venueWaitMinutes = venue?.wait_time_minutes ?? 15;
  const [status, setStatus] = useState<VenueStatus>({
    waitMinutes: venueWaitMinutes,
    crowdTag: "Wall-to-Wall",
    inboundPullUps: 142,
  });

  useEffect(() => {
    setStatus((current) => ({ ...current, waitMinutes: venueWaitMinutes }));
  }, [venueWaitMinutes]);

  const handleModeChange = (next: PortalMode) => {
    setMode(next);
    setTab(next === "setup" ? "content" : "live");
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <PortalHeader venueName={venue?.name ?? venueName ?? "Your Venue"} mode={mode} onModeChange={handleModeChange} status={status} />

      <div role="tablist" aria-label="Venue portal sections" className="flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/75 p-1.5 shadow-xl backdrop-blur-2xl">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`portal-panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative flex-1 whitespace-nowrap inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors sm:text-sm",
              tab === t.id ? "text-cyan-100" : "text-slate-400 hover:text-white",
            )}
          >
            {tab === t.id && (
              <motion.span
                layoutId="portal-tab-pill"
                className="absolute inset-0 -z-10 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.08] shadow-[0_0_18px_rgba(6,182,212,0.1)]"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            {t.icon}
            <span className="hidden xs:inline sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          id={`portal-panel-${tab}`}
          role="tabpanel"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {tab === "live" && (venue ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <OwnerLiveStatusCard venue={venue} />
              <AnnouncementsCard venue={venue} />
            </div>
          ) : <LiveCommandTab status={status} onStatusChange={setStatus} />)}
          {tab === "updates" && venue && <VenueUpdatesTab venue={venue} />}
          {tab === "content" && (venue ? <VenueProfileEditor key={venue.id} venue={venue} /> : <ContentManagerTab />)}
          {tab === "replays" && venue && <NightReplayReview clubId={venue.id} />}
          {tab === "analytics" && <AnalyticsTab venue={venue} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default VenueManagementPortal;
