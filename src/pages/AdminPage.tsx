import { motion } from 'framer-motion';
import { Shield, Check, X, MapPin, Clock, Music, Users, ArrowLeft, Loader2, Megaphone, DollarSign } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin, usePendingClubs, useApproveClub, useRejectClub } from '@/hooks/useAdmin';
import { usePendingPromotions, useApprovePromotion, useRejectPromotion } from '@/hooks/usePromotions';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const AdminPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: pendingClubs, isLoading } = usePendingClubs();
  const approveClub = useApproveClub();
  const rejectClub = useRejectClub();
  const { data: pendingPromos } = usePendingPromotions();
  const approvePromo = useApprovePromotion();
  const rejectPromo = useRejectPromotion();

  if (authLoading || adminLoading) {
    return <div className="min-h-screen gradient-dark flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const handleApprove = async (id: string, name: string) => {
    try { await approveClub.mutateAsync(id); toast.success(`✅ ${name} approved!`); } catch { toast.error('Failed'); }
  };
  const handleReject = async (id: string, name: string) => {
    try { await rejectClub.mutateAsync(id); toast.success(`❌ ${name} rejected`); } catch { toast.error('Failed'); }
  };
  const handleApprovePromo = async (id: string) => {
    try { await approvePromo.mutateAsync({ id }); toast.success('Promotion approved! ✅'); } catch { toast.error('Failed'); }
  };
  const handleRejectPromo = async (id: string) => {
    try { await rejectPromo.mutateAsync({ id }); toast.success('Promotion rejected'); } catch { toast.error('Failed'); }
  };

  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground mb-6 text-sm"><ArrowLeft className="w-4 h-4" /> Back</Link>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-xl bg-primary/20 border border-primary/30"><Shield className="w-6 h-6 text-primary" /></div>
            <div>
              <h1 className="font-display font-bold text-2xl text-foreground">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">Review submissions & promotions</p>
            </div>
          </div>

          {/* Pending Promotions */}
          {pendingPromos && pendingPromos.length > 0 && (
            <div className="mb-8">
              <h2 className="font-display font-semibold text-lg text-foreground mb-3 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-secondary" /> Pending Boosts ({pendingPromos.length})
              </h2>
              <div className="space-y-3">
                {pendingPromos.map((promo, idx) => (
                  <motion.div key={promo.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                    className="glass rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="gradient-secondary text-secondary-foreground text-[10px]">{promo.type}</Badge>
                          <span className="text-xs text-muted-foreground">{(promo as any).profile?.username || 'User'}</span>
                        </div>
                        <p className="text-sm text-foreground">Ref: <span className="font-mono text-primary">{promo.bank_reference}</span></p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" /> R{((promo.amount_cents || 0) / 100).toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApprovePromo(promo.id)} className="gap-1 gradient-primary text-primary-foreground"><Check className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="outline" onClick={() => handleRejectPromo(promo.id)} className="gap-1 border-destructive/30 text-destructive"><X className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Clubs */}
          <h2 className="font-display font-semibold text-lg text-foreground mb-3">Pending Spots</h2>
          {isLoading ? (
            <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="glass rounded-xl h-40 animate-pulse" />)}</div>
          ) : pendingClubs?.length === 0 ? (
            <div className="text-center py-16 glass rounded-xl">
              <Check className="w-12 h-12 text-primary/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-lg">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingClubs?.map((club, idx) => (
                <motion.div key={club.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="glass rounded-xl overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    {club.image_url && <img src={club.image_url} alt={club.name} className="w-full sm:w-40 h-32 sm:h-auto object-cover" />}
                    <div className="p-4 flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-display font-bold text-lg text-foreground">{club.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {club.area} — {club.address}</p>
                        </div>
                      </div>
                      {club.description && <p className="text-sm text-muted-foreground line-clamp-2">{club.description}</p>}
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {club.genre && <span className="flex items-center gap-1"><Music className="w-3 h-3" />{club.genre}</span>}
                        {club.capacity && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{club.capacity}</span>}
                        {club.opening_hours && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{club.opening_hours}</span>}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" onClick={() => handleApprove(club.id, club.name)} disabled={approveClub.isPending} className="gap-1.5 gradient-primary text-primary-foreground"><Check className="w-3.5 h-3.5" /> Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => handleReject(club.id, club.name)} disabled={rejectClub.isPending} className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"><X className="w-3.5 h-3.5" /> Reject</Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default AdminPage;
