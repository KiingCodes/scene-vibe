import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { APP_VERSION, VERSION_HISTORY } from "@/lib/version";

const SEEN_VERSION_KEY = "scene_last_seen_version";

interface Props {
  trigger?: React.ReactNode;
}

const WhatsNewDialog = ({ trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(SEEN_VERSION_KEY);
      setLastSeen(seen);
      setHasNew(seen !== APP_VERSION);
    } catch {
      setHasNew(true);
    }
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && hasNew) {
      try {
        localStorage.setItem(SEEN_VERSION_KEY, APP_VERSION);
      } catch {
        /* ignore */
      }
      setHasNew(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="relative text-[10px] text-muted-foreground/70 mt-2 font-mono hover:text-primary transition-colors underline-offset-4 hover:underline inline-flex items-center gap-2"
            aria-label="View what's new"
          >
            <span>SCENE v{APP_VERSION}</span>
            {hasNew && (
              <span className="relative flex h-2 w-2" aria-label="New update available">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
            )}
            {hasNew && (
              <span className="text-[9px] uppercase tracking-wider text-primary font-semibold">
                New
              </span>
            )}
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Sparkles className="w-5 h-5 text-primary" />
            What's New
          </DialogTitle>
          <DialogDescription>
            Recent updates and improvements to SCENE.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-3">
          <div className="space-y-5">
            {VERSION_HISTORY.map((entry, idx) => (
              <div key={entry.version} className="relative pl-4 border-l-2 border-border/40">
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant={idx === 0 ? "default" : "secondary"}
                    className="font-mono text-[10px]"
                  >
                    v{entry.version}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{entry.date}</span>
                  {idx === 0 && (
                    <Badge variant="outline" className="text-[9px] border-primary/50 text-primary">
                      LATEST
                    </Badge>
                  )}
                </div>
                <ul className="space-y-1.5">
                  {entry.highlights.map((h, i) => (
                    <li
                      key={i}
                      className="text-sm text-foreground/90 flex gap-2 leading-snug"
                    >
                      <span className="text-primary mt-1">•</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="border-t border-border/30 pt-3 mt-2 flex items-center justify-between text-[10px] font-mono text-muted-foreground/80">
          <span>
            Last seen:{" "}
            <span className="text-foreground/90">
              {lastSeen ? `v${lastSeen}` : "never"}
            </span>
          </span>
          <span>
            Current: <span className="text-primary">v{APP_VERSION}</span>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsNewDialog;