import { Link } from "react-router-dom";
import { ShieldCheck, Building2 } from "lucide-react";
import VenueManagementPortal from "@/components/venue-portal/VenueManagementPortal";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useMyVenues } from "@/hooks/useVenueOwner";
import { useState } from "react";
import { cn } from "@/lib/utils";

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen">
    <Navbar />
    <main className="px-3 sm:px-6 pt-28 pb-16">{children}</main>
  </div>
);

const VenuePortalPage = () => {
  const { user, loading } = useAuth();
  const { data: venues, isLoading } = useMyVenues();
  const [selected, setSelected] = useState<string | null>(null);

  if (loading || (user && isLoading)) {
    return <Shell><div className="mx-auto max-w-6xl h-64 rounded-2xl bg-white/5 animate-pulse" /></Shell>;
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
