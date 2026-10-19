import { Link, useSearchParams } from "react-router-dom";
import { ShieldCheck, Building2 } from "lucide-react";
import VenueManagementPortal from "@/components/venue-portal/VenueManagementPortal";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useMyVenues } from "@/hooks/useVenueOwner";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { LogoSkeleton } from "@/components/BrandedSkeleton";

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="relative isolate min-h-screen overflow-hidden bg-[#070b14] text-white">
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_8%_12%,rgba(6,182,212,0.13),transparent_34%),radial-gradient(ellipse_at_92%_25%,rgba(139,92,246,0.14),transparent_36%),linear-gradient(155deg,#0b1220_0%,#070b14_55%,#090712_100%)]" />
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 opacity-[0.1] [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
    <Navbar />
    <main className="relative px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-20 sm:px-6 sm:pt-24 lg:pb-16">{children}</main>
  </div>
);

const VenuePortalPage = () => {
  const { user, loading } = useAuth();
  const { data: venues, isLoading } = useMyVenues();
  const [params] = useSearchParams();
  const [selected, setSelected] = useState<string | null>(params.get("venue"));

  if (loading || (user && isLoading)) {
    return <Shell><LogoSkeleton label="Loading the scene…" className="mx-auto max-w-6xl" /></Shell>;
  }

  if (!user || !venues?.length) {
    return (
      <Shell>
        <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-zinc-950/70 backdrop-blur-xl p-8 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Venue Portal</h1>
          <p className="text-sm text-muted-foreground">
            {user
              ? "This portal unlocks once your venue claim is approved. Claim your venue to manage live updates, events and analytics."
              : "Sign in with the account you used to claim your venue to access the portal."}
          </p>
          <div className="flex justify-center gap-2">
            {user ? (
              <Link to="/venue-onboarding"><Button className="gradient-primary text-primary-foreground font-semibold">Claim your venue</Button></Link>
            ) : (
              <Link to="/auth"><Button className="gradient-primary text-primary-foreground font-semibold">Sign in</Button></Link>
            )}
          </div>
        </div>
      </Shell>
    );
  }

  const venue = venues.find((v) => v.id === selected) ?? venues[0];

  return (
    <Shell>
      {venues.length > 1 && (
        <div className="mx-auto max-w-6xl mb-4 flex flex-wrap gap-2">
          {venues.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelected(v.id)}
              aria-pressed={v.id === venue.id}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                v.id === venue.id
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground",
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> {v.name}
            </button>
          ))}
        </div>
      )}
      <VenueManagementPortal venue={venue} venueName={venue.name} />
    </Shell>
  );
};

export default VenuePortalPage;
