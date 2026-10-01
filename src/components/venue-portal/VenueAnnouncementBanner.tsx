import { Megaphone } from "lucide-react";
import { useVenueAnnouncements } from "@/hooks/useVenueOwner";

/** Public strip of an owner's live, unexpired announcements. */
export const VenueAnnouncementBanner = ({ clubId }: { clubId: string }) => {
  const { data } = useVenueAnnouncements(clubId);
  if (!data?.length) return null;
  return (
    <div className="mb-4 space-y-2">
      {data.map((a) => (
        <div key={a.id} className="flex items-start gap-2.5 rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3">
          <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Official update</p>
            <p className="text-sm font-semibold text-foreground">{a.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VenueAnnouncementBanner;
