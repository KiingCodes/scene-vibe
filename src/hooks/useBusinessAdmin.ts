import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const sb: any = supabase;

export type Campaign = {
  id: string; brand: string; title: string; asset_type: string;
  budget_cents: number; spent_cents: number; impressions: number; redemptions: number;
  start_date: string | null; end_date: string | null; venues: string[]; status: string;
  created_at: string;
};

export type VenueSubscription = {
  id: string; claim_id: string | null; user_id: string; venue_name: string;
  tier: 'basic' | 'pro' | 'enterprise'; status: 'pending' | 'active' | 'suspended';
  verified: boolean; renews_at: string | null; created_at: string;
};

/* ---------------- Sponsorship campaigns ---------------- */

export const useCampaigns = () =>
  useQuery({
    queryKey: ['sponsorship-campaigns'],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await sb.from('sponsorship_campaigns').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Campaign[];
    },
  });

export const useCreateCampaign = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (c: Partial<Campaign>) => {
      const { error } = await sb.from('sponsorship_campaigns').insert({ ...c, created_by: user?.id ?? null });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sponsorship-campaigns'] }),
  });
};

export const useUpdateCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Campaign> }) => {
      const { error } = await sb.from('sponsorship_campaigns').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sponsorship-campaigns'] }),
  });
};

export const useRedemptions = () =>
  useQuery({
    queryKey: ['sponsorship-redemptions'],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await sb
        .from('sponsorship_redemptions')
        .select('id, label, venue_name, created_at, campaign_id')
        .order('created_at', { ascending: false })
        .limit(15);
      if (error) throw error;
      return data || [];
    },
  });

/* ---------------- Venue subscriptions ---------------- */

export const useVenueSubscriptions = () =>
  useQuery({
    queryKey: ['venue-subscriptions'],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await sb.from('venue_subscriptions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as VenueSubscription[];
    },
  });

export const useMySubscription = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-subscription', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await sb.from('venue_subscriptions').select('*').eq('user_id', user!.id).maybeSingle();
      return (data || null) as VenueSubscription | null;
    },
  });
};

export const useMyClaim = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-venue-claim', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await sb
        .from('venue_claims').select('id, venue_name, status')
        .eq('user_id', user!.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      return data as { id: string; venue_name: string; status: string } | null;
    },
  });
};

export const useUpsertSubscription = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { id?: string; claim_id?: string | null; venue_name: string; tier?: string; status?: string; verified?: boolean; user_id?: string }) => {
      const payload: any = {
        user_id: input.user_id ?? user!.id,
        venue_name: input.venue_name,
        claim_id: input.claim_id ?? null,
      };
      if (input.tier) payload.tier = input.tier;
      if (input.status) payload.status = input.status;
      if (input.verified !== undefined) payload.verified = input.verified;
      if (input.id) {
        const { error } = await sb.from('venue_subscriptions').update(payload).eq('id', input.id);
        if (error) throw error;
      } else {
        const { error } = await sb.from('venue_subscriptions').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['venue-subscriptions'] });
      qc.invalidateQueries({ queryKey: ['my-subscription'] });
    },
  });
};

/* ---------------- Platform fee settings ---------------- */

export const usePlatformFees = () =>
  useQuery({
    queryKey: ['platform-fees'],
    queryFn: async () => {
      const { data } = await sb.from('platform_settings').select('value').eq('key', 'fees').maybeSingle();
      return (data?.value ?? { linePassFee: 15, ticketFee: 7 }) as { linePassFee: number; ticketFee: number };
    },
  });

export const useSaveFees = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (value: { linePassFee: number; ticketFee: number }) => {
      const { error } = await sb.from('platform_settings').upsert({ key: 'fees', value, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform-fees'] }),
  });
};

/* ---------------- Revenue (from approved promotions) ---------------- */

export const useRevenue = () =>
  useQuery({
    queryKey: ['platform-revenue'],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await sb
        .from('promotions')
        .select('id, amount_cents, status, type, created_at, reviewed_at, user_id')
        .order('created_at', { ascending: false })
        .limit(100);
      const rows = (data || []) as any[];
      const approved = rows.filter((r) => r.status === 'approved');
      const gmvCents = approved.reduce((s, r) => s + (r.amount_cents || 0), 0);
      return { rows, approved, gmvCents };
    },
  });
