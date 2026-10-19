import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowUpRight, CalendarDays, MapPin, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { LogoSkeleton } from "@/components/BrandedSkeleton";
import { useCountry } from "@/contexts/CountryContext";
import { supabase } from "@/integrations/supabase/client";
import { useClubs } from "@/hooks/useClubs";

const EventsPage = () => {
  const { country } = useCountry();
  const { data: clubs = [] } = useClubs();
  const {
    data: events = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["public-events", country],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("country", country)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const clubsById = useMemo(
    () => new Map(clubs.map((club) => [club.id, club])),
    [clubs],
  );

  return (
    <div className="min-h-screen bg-[#070b14] pb-[calc(6rem+env(safe-area-inset-bottom))] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_10%_8%,rgba(6,182,212,0.14),transparent_35%),radial-gradient(ellipse_at_90%_20%,rgba(217,70,239,0.12),transparent_35%),linear-gradient(155deg,#0b1220_0%,#070b14_55%,#090712_100%)]"
      />
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-10 pt-20 sm:px-6 sm:pt-24">
        <header className="mb-7 rounded-3xl border border-white/10 bg-slate-900/75 p-5 shadow-2xl backdrop-blur-2xl sm:mb-9 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200">
            <CalendarDays className="h-3.5 w-3.5" />
            Scene calendar
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            What’s on <span className="text-cyan-300">tonight?</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
            Find upcoming events and line-ups at venues around your city.
          </p>
        </header>

        {isLoading ? (
          <LogoSkeleton label="Loading upcoming events…" className="border-white/10 bg-slate-900/70" />
        ) : isError ? (
          <div role="alert" className="rounded-2xl border border-rose-300/20 bg-rose-400/[0.06] p-5 text-sm text-rose-200">
            We couldn’t load events right now. Please try again shortly.
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 text-center shadow-2xl backdrop-blur-2xl">
            <CalendarDays className="mx-auto h-8 w-8 text-cyan-300" />
            <p className="mt-3 font-semibold text-white">No upcoming events yet</p>
            <p className="mt-1 text-sm text-slate-400">Check back soon for the next night out.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const club = event.club_id ? clubsById.get(event.club_id) : undefined;
              const venue = club?.name ?? event.area ?? event.address ?? "SCENE event";

              return (
                <article
                  key={event.id}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-2xl transition-all hover:-translate-y-1 hover:border-cyan-300/25"
                >
                  {event.image_url ? (
                    <img src={event.image_url} alt="" className="h-44 w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="relative flex h-36 items-end overflow-hidden bg-gradient-to-br from-cyan-500/20 via-indigo-500/15 to-fuchsia-500/20 p-4">
                      <div aria-hidden="true" className="absolute -right-8 -top-12 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl" />
                      <CalendarDays className="relative h-8 w-8 text-cyan-200/80" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-200">
                        {event.category || "Event"}
                      </span>
                      {event.is_boosted && <span className="text-[10px] font-semibold text-fuchsia-200">Featured</span>}
                    </div>
                    <h2 className="line-clamp-2 text-lg font-bold text-white">{event.title}</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
                      <span className="truncate">{venue}</span>
                    </p>
                    <p className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-200">
                      <CalendarDays className="h-4 w-4 shrink-0 text-cyan-300" />
                      {format(new Date(event.event_date), "EEE, d MMM · h:mm a")}
                    </p>
                    {event.description && (
                      <p className="mt-3 line-clamp-3 text-sm leading-5 text-slate-400">{event.description}</p>
                    )}
                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-200">
                        <Ticket className="h-4 w-4 text-cyan-300" />
                        {event.price_info || "See venue for entry"}
                      </span>
                      {event.club_id && (
                        <Link
                          to={`/venue/${event.club_id}`}
                          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-cyan-200 hover:text-white"
                        >
                          Venue <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default EventsPage;
