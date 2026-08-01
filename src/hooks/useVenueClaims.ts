import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type VenueClaim = {
  id: string;
  user_id: string;
  venue_name: string;
  legal_name: string | null;
  email: string | null;
  phone: string | null;
  tags: string[] | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  radius_m: number | null;
  geofence_verified: boolean | null;
  verification_method: string | null;
  document_url: string | null;
  document_name?: string | null;
  otp_verified: boolean | null;
  status: string;
  step: number;
  review_note?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
};

/** All venue claims (admin-only via RLS), newest first. */
export const useVenueClaims = (status: string = 'all') => {
  return useQuery({
    queryKey: ['venue-claims', status],
    refetchInterval: 30_000,
    queryFn: async () => {
      let q = (supabase as any)
        .from('venue_claims')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(200);
      if (status !== 'all') q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as VenueClaim[];
    },
  });
};

/** Signed URL for a private venue-docs object (admins + owners). */
export const useClaimDocumentUrl = (path?: string | null) => {
  return useQuery({
    queryKey: ['venue-claim-doc', path],
    enabled: !!path,
    staleTime: 4 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from('venue-docs').createSignedUrl(path!, 300);
      if (error) throw error;
      return data.signedUrl;
    },
  });
};

export const useModerateClaim = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: 'approved' | 'rejected' | 'in_review' | 'submitted'; note?: string }) => {
      const { error } = await (supabase as any)
        .from('venue_claims')
        .update({
          status,
          review_note: note ?? null,
          reviewed_by: user?.id ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
      try {
        await (supabase as any).from('admin_audit_log').insert({
          admin_id: user!.id, target_user_id: null, action: `venue_claim_${status}`, details: { id, note },
        });
      } catch { /* non-fatal */ }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['venue-claims'] }),
  });
};
