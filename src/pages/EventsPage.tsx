import { motion } from 'framer-motion';
import { Calendar, Lock, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const EventsPage = () => {
  return (
    <div className="min-h-screen gradient-dark">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-10 text-center mt-8"
        >
          <div className="w-20 h-20 mx-auto mb-5 rounded-full gradient-primary flex items-center justify-center">
            <Lock className="w-9 h-9 text-primary-foreground" />
          </div>
          <h1 className="font-display font-bold text-3xl text-foreground mb-2 flex items-center justify-center gap-2">
            <Calendar className="w-7 h-7 text-secondary" /> Events & Promotions
          </h1>
          <p className="text-sm uppercase tracking-widest text-primary mb-4 flex items-center justify-center gap-1">
            <Sparkles className="w-4 h-4" /> Coming Soon
          </p>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            We're polishing event posting, promoter boosts, and ticketing. This section is locked
            for now — check back soon for the launch.
          </p>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default EventsPage;
