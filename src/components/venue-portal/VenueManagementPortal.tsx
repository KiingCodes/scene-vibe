import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Zap, Sparkles, TrendingUp } from "lucide-react";
import { PortalHeader } from "./PortalHeader";
import { LiveCommandTab } from "./LiveCommandTab";
import { ContentManagerTab } from "./ContentManagerTab";
import { AnalyticsTab } from "./AnalyticsTab";
import { PortalMode, VenueStatus } from "./types";
import { cn } from "@/lib/utils";

type TabId = "live" | "content" | "analytics";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "live", label: "Live Command", icon: <Zap className="h-4 w-4" /> },
  { id: "content", label: "Profile & Content", icon: <Sparkles className="h-4 w-4" /> },
  { id: "analytics", label: "Analytics", icon: <TrendingUp className="h-4 w-4" /> },
];

interface VenueManagementPortalProps {
  venueName?: string;
}

export const VenueManagementPortal = ({ venueName = "Konka Soweto" }: VenueManagementPortalProps) => {
  const [mode, setMode] = useState<PortalMode>("live");
  const [tab, setTab] = useState<TabId>("live");
  const [status, setStatus] = useState<VenueStatus>({
    waitMinutes: 15,
    crowdTag: "Wall-to-Wall",
    inboundPullUps: 142,
  });

  const handleModeChange = (next: PortalMode) => {
    setMode(next);
    setTab(next === "setup" ? "content" : "live");
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <PortalHeader venueName={venueName} mode={mode} onModeChange={handleModeChange} status={status} />

      <div role="tablist" aria-label="Venue portal sections" className="flex gap-1 rounded-2xl border border-white/10 bg-zinc-950/70 p-1 backdrop-blur-xl overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`portal-panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative flex-1 whitespace-nowrap inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
              tab === t.id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab === t.id && (
              <motion.span
                layoutId="portal-tab-pill"
                className="absolute inset-0 -z-10 rounded-xl border border-white/10 bg-gradient-to-r from-portal-violet/25 via-portal-pink/20 to-portal-cyan/25"
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
          {tab === "live" && <LiveCommandTab status={status} onStatusChange={setStatus} />}
          {tab === "content" && <ContentManagerTab />}
          {tab === "analytics" && <AnalyticsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default VenueManagementPortal;