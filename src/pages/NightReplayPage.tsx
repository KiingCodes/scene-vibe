import { motion } from 'framer-motion';
import { Moon, Flame, MessageSquare, MapPin, Clock, Trophy, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useNightReplays } from '@/hooks/useNightReplays';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1 },
};

const NightReplayPage = () => {
  const { data: replays, isLoading } = useNightReplays();

  const formatHour = (h: number | null) => {
    if (h === null || h === undefined) return 'N/A';
    if (h === 0) return '12am';
    if (h === 12) return '12pm';
    return h > 12 ? `${h - 12}pm` : `${h}am`;
  };

  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-8 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="inline-block"
          >
            <Moon className="w-10 h-10 text-primary mx-auto" />
          </motion.div>
          <h1 className="font-display font-bold text-3xl text-foreground mt-2">Night Replay</h1>
          <p className="text-muted-foreground mt-1">Relive last night's energy 🔥</p>
        </motion.div>

        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass rounded-xl h-40 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && (!replays || replays.length === 0) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <Sparkles className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">No night replays yet. They appear after a night ends!</p>
          </motion.div>
        )}

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          {replays?.map(replay => (
            <motion.div
              key={replay.id}
              variants={item}
              whileHover={{ scale: 1.01 }}
              className="glass rounded-xl p-5 space-y-4 border border-border/30 hover:border-primary/30 transition-all"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="w-5 h-5 text-primary" />
                  <h3 className="font-display font-semibold text-foreground">
                    {format(new Date(replay.replay_date + 'T00:00:00'), 'EEEE, MMM d')}
                  </h3>
                </div>
                <span className="text-xs text-muted-foreground">{format(new Date(replay.replay_date + 'T00:00:00'), 'yyyy')}</span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-primary/10 rounded-lg p-3 text-center"
                >
                  <Flame className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-xl font-bold text-foreground">{replay.total_vibes}</p>
                  <p className="text-[10px] text-muted-foreground">Vibes</p>
                </motion.div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-secondary/10 rounded-lg p-3 text-center"
                >
                  <MessageSquare className="w-5 h-5 text-secondary mx-auto mb-1" />
                  <p className="text-xl font-bold text-foreground">{replay.total_messages}</p>
                  <p className="text-[10px] text-muted-foreground">Messages</p>
                </motion.div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-accent/10 rounded-lg p-3 text-center"
                >
                  <Clock className="w-5 h-5 text-accent mx-auto mb-1" />
                  <p className="text-xl font-bold text-foreground">{formatHour(replay.peak_hour)}</p>
                  <p className="text-[10px] text-muted-foreground">Peak Hour</p>
                </motion.div>
              </div>

              {/* Top Club */}
              {replay.top_club_name && (
                <div className="flex items-center gap-2 bg-muted/20 rounded-lg px-3 py-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-foreground font-medium">Top Club:</span>
                  {replay.top_club_id ? (
                    <Link to={`/club/${replay.top_club_id}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {replay.top_club_name}
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">{replay.top_club_name}</span>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default NightReplayPage;
