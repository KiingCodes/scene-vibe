import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarDays, Clock3, Ticket } from "lucide-react";
import { LogoSkeleton } from "@/components/BrandedSkeleton";
import { useVenueAnnouncements, useVenueEvents } from "@/hooks/useVenueOwner";

type PublicVenueUpdatesProps = {
  clubId: string;
};

const PublicVenueUpdates = ({ clubId }: PublicVenueUpdatesProps) => {
  const [tab, setTab] = useState<"specials" | "events">("specials");
  const { data: specials = [], isLoading: specialsLoading } = useVenueAnnouncements(clubId);
  const { data: events = [], isLoading: eventsLoading } = useVenueEvents(clubId);
  const upcomingEvents = useMemo(
    () => events.filter((event) => new Date(event.event_date).getTime() >= Date.now()),
    [events],
  );
  const loading = tab === "specials" ? specialsLoading : eventsLoading;

  return (
    <section className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/75 shadow-2xl backdrop-blur-2xl">
      <div className="flex border-b border-white/10 p-1.5">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "specials"}
          onClick={() => setTab("specials")}
          className={`min-h-11 flex-1 rounded-2xl px-3 text-sm font-semibold transition-colors ${
            tab === "specials"
              ? "border border-cyan-300/25 bg-cyan-300/10 text-cyan-100 shadow-[0_0_18px_rgba(6,182,212,0.1)]"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          Live Specials
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "events"}
          onClick={() => setTab("events")}
          className={`min-h-11 flex-1 rounded-2xl px-3 text-sm font-semibold transition-colors ${
            tab === "events"
              ? "border border-cyan-300/25 bg-cyan-300/10 text-cyan-100 shadow-[0_0_18px_rgba(6,182,212,0.1)]"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          Events
        </button>
      </div>

      <div role="tabpanel" className="p-4 sm:p-5">
        {loading ? (
          <LogoSkeleton
            label={tab === "specials" ? "Loading live specials…" : "Loading venue events…"}
            size={32}
            className="border-0 bg-transparent py-5"
          />
        ) : tab === "specials" ? (
          specials.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {specials.map((special) => {
                const minutesLeft = Math.max(
                  0,
                  Math.ceil((new Date(special.expires_at).getTime() - Date.now()) / 60_000),
                );
                const remaining = minutesLeft >= 60
                  ? `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m left`
                  : `${minutesLeft}m left`;
                return (
                  <article key={special.id} className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4">
                    <p className="text-sm font-semibold leading-6 text-slate-100">{special.content}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-cyan-200">
                      <Clock3 className="h-3.5 w-3.5" />
                      {remaining}
                    </p>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="py-3 text-center text-sm text-slate-400">No live specials at the moment.</p>
          )
        ) : upcomingEvents.length ? (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <article key={event.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-semibold text-white">{event.title}</h3>
                  {event.price_info && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-2.5 py-1 text-xs font-semibold text-cyan-100">
                      <Ticket className="h-3.5 w-3.5" />
                      {event.price_info}
                    </span>
                  )}
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                  <CalendarDays className="h-3.5 w-3.5 text-cyan-300" />
                  {format(new Date(event.event_date), "EEE, d MMM yyyy · h:mm a")}
                </p>
                {event.description && (
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-300">{event.description}</p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="py-3 text-center text-sm text-slate-400">No upcoming events listed yet.</p>
        )}
      </div>
    </section>
  );
};

export default PublicVenueUpdates;
