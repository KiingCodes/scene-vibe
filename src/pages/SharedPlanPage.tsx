import { motion } from 'framer-motion';
import { PartyPopper, MapPin, ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useSharedPlan } from '@/hooks/useNightPlans';
import Navbar from '@/components/Navbar';

const SharedPlanPage = () => {
  const { token } = useParams<{ token: string }>();
  const { data: plan, isLoading } = useSharedPlan(token || '');

  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-8 max-w-lg">
        <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        {isLoading ? (
          <div className="glass rounded-xl h-48 animate-pulse" />
        ) : !plan ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Plan not found or link has expired.</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="text-center mb-6">
              <PartyPopper className="w-10 h-10 text-secondary mx-auto mb-2" />
              <h1 className="font-display font-bold text-2xl text-foreground">{plan.title}</h1>
              <p className="text-sm text-muted-foreground">Shared night out plan</p>
            </div>

            <div className="space-y-3">
              {(plan.night_plan_items || [])
                .sort((a: any, b: any) => a.position - b.position)
                .map((item: any, idx: number) => {
                  const club = item.clubs;
                  if (!club) return null;
                  return (
                    <Link key={item.id} to={`/club/${club.id}`}>
                      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                        className="glass rounded-xl p-4 flex items-center gap-3 hover:border-primary/30 transition-all">
                        <span className="text-lg font-bold text-primary w-8 text-center">{idx + 1}</span>
                        <img src={club.image_url || '/placeholder.svg'} alt={club.name} className="w-14 h-14 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold text-foreground truncate">{club.name}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{club.area}</p>
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default SharedPlanPage;
