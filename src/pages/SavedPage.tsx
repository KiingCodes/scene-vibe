import { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Heart, Plus, Trash2, Share2, GripVertical, MapPin, ArrowLeft, PartyPopper, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFavoriteClubs } from '@/hooks/useFavorites';
import { useNightPlans, useCreatePlan, useDeletePlan, useUpdatePlanItems } from '@/hooks/useNightPlans';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import type { Club } from '@/hooks/useClubs';

const SavedPage = () => {
  const { user } = useAuth();
  const { data: favoriteClubs, isLoading: favsLoading } = useFavoriteClubs();
  const { data: plans, isLoading: plansLoading } = useNightPlans();
  const createPlan = useCreatePlan();
  const deletePlan = useDeletePlan();
  const updatePlanItems = useUpdatePlanItems();

  const [tab, setTab] = useState<'saved' | 'plans'>('saved');
  const [creating, setCreating] = useState(false);
  const [planTitle, setPlanTitle] = useState("Tonight's Plan");
  const [selectedClubs, setSelectedClubs] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleSelect = (id: string) => {
    setSelectedClubs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (selectedClubs.size === 0) {
      toast.error('Select at least one club');
      return;
    }
    try {
      await createPlan.mutateAsync({ title: planTitle, clubIds: Array.from(selectedClubs) });
      toast.success('🎉 Plan created!');
      setCreating(false);
      setSelectedClubs(new Set());
      setPlanTitle("Tonight's Plan");
    } catch {
      toast.error('Failed to create plan');
    }
  };

  const handleShare = async (shareToken: string) => {
    const url = `${window.location.origin}/plan/${shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(shareToken);
    toast.success('Link copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!user) {
    return (
      <div className="min-h-screen gradient-dark">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-8 text-center">
          <Heart className="w-12 h-12 text-secondary mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Sign in to save your favorite clubs</p>
          <Link to="/auth"><Button className="gradient-primary text-primary-foreground">Sign In</Button></Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-8 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-6">
            <Link to="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="font-display font-bold text-2xl text-foreground">Your Night Out</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <Button size="sm" variant={tab === 'saved' ? 'default' : 'outline'} onClick={() => setTab('saved')}
              className={tab === 'saved' ? 'gradient-primary text-primary-foreground' : 'border-border/50 text-muted-foreground'}>
              <Heart className="w-3.5 h-3.5 mr-1" /> Saved ({favoriteClubs?.length || 0})
            </Button>
            <Button size="sm" variant={tab === 'plans' ? 'default' : 'outline'} onClick={() => setTab('plans')}
              className={tab === 'plans' ? 'gradient-secondary text-secondary-foreground' : 'border-border/50 text-muted-foreground'}>
              <PartyPopper className="w-3.5 h-3.5 mr-1" /> Plans ({plans?.length || 0})
            </Button>
          </div>

          {tab === 'saved' && (
            <div className="space-y-3">
              {favsLoading ? (
                Array.from({ length: 3 }).map((_, i) => <div key={i} className="glass rounded-xl h-20 animate-pulse" />)
              ) : favoriteClubs?.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No saved clubs yet. Tap the heart icon on any club to save it.</p>
                </div>
              ) : (
                <>
                  {!creating && (
                    <Button onClick={() => setCreating(true)} className="w-full gap-2 bg-secondary/20 border border-secondary/30 text-secondary hover:bg-secondary/30" variant="outline">
                      <Plus className="w-4 h-4" /> Create Tonight's Plan
                    </Button>
                  )}
                  {creating && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass rounded-xl p-4 space-y-3">
                      <Input value={planTitle} onChange={e => setPlanTitle(e.target.value)} placeholder="Plan name..." className="bg-muted/50 border-border/50" />
                      <p className="text-xs text-muted-foreground">Select clubs for your plan:</p>
                      {(favoriteClubs as Club[])?.map(club => (
                        <label key={club.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 cursor-pointer">
                          <Checkbox checked={selectedClubs.has(club.id)} onCheckedChange={() => toggleSelect(club.id)} />
                          <span className="text-sm text-foreground">{club.name}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{club.area}</span>
                        </label>
                      ))}
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleCreate} disabled={createPlan.isPending} className="gradient-secondary text-secondary-foreground flex-1">
                          {createPlan.isPending ? 'Creating...' : 'Create Plan'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setCreating(false)} className="border-border/50 text-muted-foreground">Cancel</Button>
                      </div>
                    </motion.div>
                  )}
                  {(favoriteClubs as Club[])?.map(club => (
                    <Link key={club.id} to={`/club/${club.id}`}>
                      <div className="glass rounded-xl p-4 flex items-center gap-3 hover:border-primary/30 transition-all">
                        <img src={club.image_url || '/placeholder.svg'} alt={club.name} className="w-14 h-14 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold text-foreground truncate">{club.name}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{club.area}</p>
                        </div>
                        <Heart className="w-4 h-4 text-secondary fill-secondary" />
                      </div>
                    </Link>
                  ))}
                </>
              )}
            </div>
          )}

          {tab === 'plans' && (
            <div className="space-y-4">
              {plansLoading ? (
                Array.from({ length: 2 }).map((_, i) => <div key={i} className="glass rounded-xl h-32 animate-pulse" />)
              ) : plans?.length === 0 ? (
                <div className="text-center py-12">
                  <PartyPopper className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No plans yet. Save some clubs first, then create a plan!</p>
                </div>
              ) : (
                plans?.map(plan => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onShare={() => handleShare(plan.share_token)}
                    onDelete={() => deletePlan.mutateAsync(plan.id)}
                    onReorder={(ids) => updatePlanItems.mutateAsync({ planId: plan.id, clubIds: ids })}
                    copied={copiedId === plan.share_token}
                  />
                ))
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

interface PlanCardProps {
  plan: any;
  onShare: () => void;
  onDelete: () => void;
  onReorder: (ids: string[]) => void;
  copied: boolean;
}

const PlanCard = ({ plan, onShare, onDelete, onReorder, copied }: PlanCardProps) => {
  const items = (plan.night_plan_items || [])
    .sort((a: any, b: any) => a.position - b.position);
  const [orderedIds, setOrderedIds] = useState<string[]>(items.map((i: any) => i.club_id));

  const handleReorder = (newOrder: string[]) => {
    setOrderedIds(newOrder);
    onReorder(newOrder);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-foreground">{plan.title}</h3>
        <div className="flex gap-1.5">
          <Button size="icon" variant="ghost" onClick={onShare} className="h-8 w-8 text-muted-foreground hover:text-primary">
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Share2 className="w-4 h-4" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete} className="h-8 w-8 text-muted-foreground hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Reorder.Group axis="y" values={orderedIds} onReorder={handleReorder} className="space-y-2">
        {orderedIds.map((clubId, idx) => {
          const item = items.find((i: any) => i.club_id === clubId);
          const club = item?.clubs;
          if (!club) return null;
          return (
            <Reorder.Item key={clubId} value={clubId}>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                <span className="text-xs font-bold text-primary w-5">{idx + 1}</span>
                <img src={club.image_url || '/placeholder.svg'} alt={club.name} className="w-10 h-10 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{club.name}</p>
                  <p className="text-xs text-muted-foreground">{club.area}</p>
                </div>
              </div>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>

      <p className="text-xs text-muted-foreground text-center">Drag to reorder your night</p>
    </motion.div>
  );
};

export default SavedPage;
