import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { distanceMeters } from '@/lib/geo';
import type { Club } from './useClubs';

/** Venues owned (claimed + approved) by the signed-in user. */
export const useMyVenues = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-venues', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('owner_id', user!.id)
        .order('name');
      if (error) throw error;
      return (data || []) as Club[];
    },
  });
};

/** Set of user ids that own a verified venue — used for "Official Account" tags. */
export const useVenueOwnerIds = () => {
  return useQuery({
    queryKey: ['venue-owner-ids'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clubs')
        .select('owner_id')
        .eq('status', 'approved')
        .not('owner_id', 'is', null);
      if (error) throw error;
      return new Set<string>((data || []).map((r: { owner_id: string | null }) => r.owner_id!).filter(Boolean));
    },
  });
};

/** Does this venue have a verified owner? */
export const isVerifiedVenue = (club?: Pick<Club, 'owner_id' | 'verified_at' | 'status'> | null) =>
  !!club && club.status === 'approved' && (!!club.owner_id || !!club.verified_at);

export interface VenueAnalytics {
  favorites: number;
  vibes7d: number;
  pullUps7d: number;
  reviews: number;
  nearbyArrivals: number;
  hourly: { hour: string; pct: number }[];
}

/** Real analytics for an owned venue. */
export const useVenueAnalytics = (clubId?: string, lat?: number, lng?: number) => {
  return useQuery({
    queryKey: ['venue-analytics', clubId],
    enabled: !!clubId,
    refetchInterval: 60_000,
    queryFn: async (): Promise<VenueAnalytics> => {
      const since = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();

      const [fav, vibes, pull, revs, safety] = await Promise.all([
        supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('club_id', clubId!),
        supabase.from('vibes').select('created_at').eq('club_id', clubId!).gte('created_at', since),
        supabase.from('pulling_up').select('id', { count: 'exact', head: true }).eq('club_id', clubId!).gte('created_at', since),
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('club_id', clubId!),
        supabase.from('safety_sessions').select('destination_lat,destination_lng,status').gte('created_at', since),
      ]);

      const vibeRows = (vibes.data || []) as { created_at: string }[];
      const buckets = new Array(24).fill(0) as number[];
      vibeRows.forEach((v) => { buckets[new Date(v.created_at).getHours()] += 1; });
      const nightHours = [20, 21, 22, 23, 0, 1, 2];
      const max = Math.max(1, ...nightHours.map((h) => buckets[h]));
      const hourly = nightHours.map((h) => ({
        hour: `${String(h).padStart(2, '0')}:00`,
        pct: Math.round((buckets[h] / max) * 100),
      }));

      let nearbyArrivals = 0;
      if (lat != null && lng != null) {
        ((safety.data || []) as { destination_lat: number; destination_lng: number; status: string }[]).forEach((s) => {
          if (distanceMeters(lat, lng, s.destination_lat, s.destination_lng) <= 500) nearbyArrivals += 1;
        });
      }

      return {
        favorites: fav.count || 0,
        vibes7d: vibeRows.length,
        pullUps7d: pull.count || 0,
        reviews: revs.count || 0,
        nearbyArrivals,
        hourly,
      };
    },
  });
};

/** Post an official live update from the venue into the public feed/chat. */
export const usePostVenueUpdate = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clubId, content, country }: { clubId: string; content: string; country: string }) => {
      const { error } = await supabase.from('messages').insert({
        club_id: clubId,
        user_id: user!.id,
        content,
        message_type: 'text',
        country,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages'] });
      qc.invalidateQueries({ queryKey: ['community-messages'] });
    },
  });
};

export type VenueEvent = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  club_id: string | null;
  category: string;
  price_info: string | null;
};

export const useVenueEvents = (clubId?: string) => {
  return useQuery({
    queryKey: ['venue-events', clubId],
    enabled: !!clubId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id,title,description,event_date,club_id,category,price_info')
        .eq('club_id', clubId!)
        .order('event_date', { ascending: true });
      if (error) throw error;
      return (data || []) as VenueEvent[];
    },
  });
};

export const useCreateVenueEvent = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      clubId: string;
      title: string;
      description?: string;
      event_date: string;
      price_info?: string;
      area?: string | null;
      address?: string | null;
      lat?: number | null;
      lng?: number | null;
      country: string;
    }) => {
      const { error } = await supabase.from('events').insert({
        promoter_id: user!.id,
        club_id: payload.clubId,
        title: payload.title,
        description: payload.description || null,
        event_date: payload.event_date,
        price_info: payload.price_info || null,
        area: payload.area ?? null,
        address: payload.address ?? null,
        lat: payload.lat ?? null,
        lng: payload.lng ?? null,
        category: 'party',
        country: payload.country,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['venue-events'] });
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

export const useDeleteVenueEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['venue-events'] });
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

/* ------------------------------------------------------------------ *
 * Owner editing: venue row updates, imagery and live announcements
 * ------------------------------------------------------------------ */

export const CROWD_LEVELS = ['SPACIOUS', 'BUSY', 'PACKED', 'FULL LINE'] as const;
export type CrowdLevel = (typeof CROWD_LEVELS)[number];

export type VenueEditableFields = Partial<
  Pick<
    Club,
    | 'live_status'
    | 'is_live'
    | 'opening_hours'
    | 'genre'
    | 'cover_charge'
    | 'address'
    | 'area'
    | 'description'
    | 'phone'
    | 'website'
    | 'instagram'
    | 'image_url'
    | 'gallery'
    | 'lat'
    | 'lng'
  >
>;

/** Update an owned venue. RLS only allows the owner (or an admin) through. */
export const useUpdateVenue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clubId, patch }: { clubId: string; patch: VenueEditableFields }) => {
      const payload: Record<string, unknown> = { ...patch };
      if ('live_status' in patch || 'is_live' in patch) payload.status_updated_at = new Date().toISOString();
      const { data, error } = await supabase
        .from('clubs')
        .update(payload)
        .eq('id', clubId)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('You do not have permission to update this venue.');
      return data as Club;
    },
    onSuccess: (club) => {
      qc.setQueryData(['club', club.id], club);
      qc.invalidateQueries({ queryKey: ['clubs'] });
      qc.invalidateQueries({ queryKey: ['my-venues'] });
    },
  });
};

/** Upload a venue image (cover or gallery) and return its public URL. */
export const uploadVenueImage = async (clubId: string, file: File) => {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `venues/${clubId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('chat-media').upload(path, file, { upsert: true });
  if (error) throw error;
  return supabase.storage.from('chat-media').getPublicUrl(path).data.publicUrl;
};

export type VenueAnnouncement = {
  id: string;
  club_id: string;
  user_id: string;
  content: string;
  expires_at: string;
  created_at: string;
};

/** Live (non-expired) announcements for a venue. */
export const useVenueAnnouncements = (clubId?: string) =>
  useQuery({
    queryKey: ['venue-announcements', clubId],
    enabled: !!clubId,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_announcements')
        .select('*')
        .eq('club_id', clubId!)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as VenueAnnouncement[];
    },
  });

export const usePostAnnouncement = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clubId, content, hours }: { clubId: string; content: string; hours: number }) => {
      const { error } = await supabase.from('venue_announcements').insert({
        club_id: clubId,
        user_id: user!.id,
        content,
        expires_at: new Date(Date.now() + hours * 3600_000).toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['venue-announcements'] }),
  });
};

export const useDeleteAnnouncement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('venue_announcements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['venue-announcements'] }),
  });
};
