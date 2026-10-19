import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCountry } from "@/contexts/CountryContext";

export type PublicVenueAnnouncement = {
  id: string;
  club_id: string;
  content: string;
  expires_at: string;
  created_at: string;
  venue: {
    id: string;
    name: string;
    area: string;
    country: string;
    is_live: boolean;
    is_verified: boolean;
  };
};

export const usePublicVenueAnnouncements = (realtime = true) => {
  const { country } = useCountry();
  const queryClient = useQueryClient();
  const queryKey = ["public-venue-announcements", country];

  useEffect(() => {
    if (!realtime) return;
    const channel = supabase
      .channel(`public-venue-announcements-${country}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "venue_announcements" },
        () => {
          void queryClient.invalidateQueries({ queryKey });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [country, queryClient, realtime]);

  return useQuery({
    queryKey,
    queryFn: async (): Promise<PublicVenueAnnouncement[]> => {
      const { data: announcements, error: announcementsError } = await supabase
        .from("venue_announcements")
        .select("id, club_id, content, expires_at, created_at")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(100);
      if (announcementsError) throw announcementsError;
      if (!announcements?.length) return [];

      const clubIds = [...new Set(announcements.map(({ club_id }) => club_id))];
      const { data: venues, error: venuesError } = await supabase
        .from("clubs")
        .select("id, name, area, country, is_live, is_verified")
        .in("id", clubIds)
        .eq("country", country)
        .eq("is_verified", true);
      if (venuesError) throw venuesError;

      const venuesById = new Map((venues ?? []).map((venue) => [venue.id, venue]));
      return announcements.flatMap((announcement) => {
        const venue = venuesById.get(announcement.club_id);
        return venue ? [{ ...announcement, venue }] : [];
      });
    },
    refetchInterval: 60_000,
  });
};

export default usePublicVenueAnnouncements;
