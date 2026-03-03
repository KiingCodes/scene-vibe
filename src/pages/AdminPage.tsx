import { motion } from 'framer-motion';
import { Shield, Check, X, MapPin, Clock, Music, Users, ArrowLeft, Loader2 } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin, usePendingClubs, useApproveClub, useRejectClub } from '@/hooks/useAdmin';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const AdminPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: pendingClubs, isLoading } = usePendingClubs();
  const approveClub = useApproveClub();
  const rejectClub = useRejectClub();

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleApprove = async (id: string, name: string) => {
    try {
      await approveClub.mutateAsync(id);
      toast.success(`✅ ${name} approved!`);
    } catch {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (id: string, name: string) => {
    try {
      await rejectClub.mutateAsync(id);
      toast.success(`❌ ${name} rejected`);
    } catch {
      toast.error('Failed to reject');
    }
  };

  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-xl bg-primary/20 border border-primary/30">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-foreground">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">Review community spot submissions</p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass rounded-xl h-40 animate-pulse" />
              ))}
            </div>
          ) : pendingClubs?.length === 0 ? (
            <div className="text-center py-16 glass rounded-xl">
              <Check className="w-12 h-12 text-primary/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-lg">All caught up!</p>
              <p className="text-sm text-muted-foreground/70">No pending submissions to review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{pendingClubs?.length} pending submission{(pendingClubs?.length || 0) > 1 ? 's' : ''}</p>
              {pendingClubs?.map((club, idx) => (
                <motion.div
                  key={club.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass rounded-xl overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row">
                    {club.image_url && (
                      <img src={club.image_url} alt={club.name} className="w-full sm:w-40 h-32 sm:h-auto object-cover" />
                    )}
                    <div className="p-4 flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-display font-bold text-lg text-foreground">{club.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {club.area} — {club.address}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary border border-secondary/30 whitespace-nowrap">
                          <Users className="w-3 h-3 inline mr-1" />Community
                        </span>
                      </div>

                      {club.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{club.description}</p>
                      )}

                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {club.genre && <span className="flex items-center gap-1"><Music className="w-3 h-3" />{club.genre}</span>}
                        {club.capacity && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{club.capacity}</span>}
                        {club.opening_hours && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{club.opening_hours}</span>}
                      </div>

                      <p className="text-xs text-muted-foreground/50">
                        Submitted {new Date(club.created_at).toLocaleDateString()}
                        {' · '}Lat: {club.lat.toFixed(4)}, Lng: {club.lng.toFixed(4)}
                      </p>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(club.id, club.name)}
                          disabled={approveClub.isPending}
                          className="gap-1.5 gradient-primary text-primary-foreground"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(club.id, club.name)}
                          disabled={rejectClub.isPending}
                          className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </Button>
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
