import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Club = Tables<'clubs'>;

// Fetch all clubs (from both clubs table and approved pending_clubs)
export const useClubs = () => {
  return useQuery({
    queryKey: ['clubs'],
    queryFn: async () => {
      // Fetch from clubs table
      const { data: mainClubs, error: e1 } = await supabase
        .from('clubs')
        .select('*')
        .order('name');
      if (e1) throw e1;

      // Fetch approved community spots
      const { data: approvedPending, error: e2 } = await supabase
        .from('pending_clubs')
        .select('*')
        .eq('status', 'approved')
        .order('name');
      if (e2) throw e2;

      // Map pending_clubs to Club shape
      const communityClubs: Club[] = (approvedPending || []).map(pc => ({
        id: pc.id,
        name: pc.name,
        address: pc.address,
        area: pc.area,
        lat: pc.lat,
        lng: pc.lng,
        description: pc.description,
        image_url: pc.image_url,
        genre: pc.genre,
        capacity: pc.capacity,
        opening_hours: pc.opening_hours,
        phone: pc.phone,
        website: pc.website,
        instagram: pc.instagram,
        is_community_added: true,
        created_at: pc.created_at,
      }));

      // Merge, avoiding duplicates by id
      const mainIds = new Set((mainClubs || []).map(c => c.id));
      const merged = [
        ...(mainClubs || []),
        ...communityClubs.filter(c => !mainIds.has(c.id)),
      ];
      return merged;
    },
  });
};

// Fetch a single club by ID
export const useClub = (id: string) => {
  return useQuery({
    queryKey: ['club', id],
    queryFn: async () => {
      // Try clubs table first
      const { data: club, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (club) return club as Club;

      // Try approved pending_clubs
      const { data: pc, error: e2 } = await supabase
        .from('pending_clubs')
        .select('*')
        .eq('id', id)
        .eq('status', 'approved')
        .maybeSingle();
      if (e2) throw e2;
      if (!pc) throw new Error('Club not found');

      return {
        id: pc.id,
        name: pc.name,
        address: pc.address,
        area: pc.area,
        lat: pc.lat,
        lng: pc.lng,
        description: pc.description,
        image_url: pc.image_url,
        genre: pc.genre,
        capacity: pc.capacity,
        opening_hours: pc.opening_hours,
        phone: pc.phone,
        website: pc.website,
        instagram: pc.instagram,
        is_community_added: true,
        created_at: pc.created_at,
      } as Club;
    },
    enabled: !!id,
  });
};
