import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Tables that should trigger a refresh of admin dashboards, and the query keys they feed. */
const WATCH: { table: string; keys: string[] }[] = [
  { table: 'admin_audit_log', keys: ['admin-audit'] },
  { table: 'venue_claims', keys: ['venue-claims', 'admin-stats'] },
  { table: 'venue_subscriptions', keys: ['venue-subscriptions'] },
  { table: 'sponsorship_campaigns', keys: ['sponsorship-campaigns'] },
  { table: 'sponsorship_redemptions', keys: ['sponsorship-redemptions'] },
  { table: 'promotions', keys: ['platform-revenue', 'pending-promotions', 'admin-stats'] },
  { table: 'pending_clubs', keys: ['pending-clubs', 'admin-stats'] },
  { table: 'profiles', keys: ['admin-users', 'admin-stats'] },
  { table: 'platform_settings', keys: ['platform-fees'] },
];

/**
 * Live-streams backend changes into every admin dashboard so approvals, bans,
 * campaigns and audit entries appear without a manual refresh.
 */
export const useAdminRealtime = (enabled = true) => {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const channel = supabase.channel('admin-realtime');

    WATCH.forEach(({ table, keys }) => {
      channel.on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table },
        () => keys.forEach((key) => qc.invalidateQueries({ queryKey: [key] })),
      );
    });

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, enabled]);
};
