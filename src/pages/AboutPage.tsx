import { motion } from 'framer-motion';
import { ArrowLeft, Flame, Users, MapPin, Star, Zap, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const AboutPage = () => (
  <div className="min-h-screen gradient-dark">
    <Navbar />
    <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
      <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <h1 className="font-display font-bold text-4xl sm:text-5xl text-foreground mb-4">
          The Story Behind <span className="text-primary neon-text">SCENE</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          We got tired of pulling up to dead spots. So we built something about it.
        </p>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={item} className="glass rounded-xl p-6 sm:p-8">
          <h2 className="font-display font-semibold text-xl text-foreground mb-3 flex items-center gap-2">
            <Flame className="w-6 h-6 text-secondary" /> The Problem
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Every weekend, the same question echoes through group chats across the city: <em className="text-foreground">"Where's the vibe tonight?"</em> You check Instagram stories — 3 hours old. You call your friend — they left an hour ago. You pull up to a spot the influencer posted about — it's dead. The nightlife is unpredictable, and by the time you get information, it's already outdated.
          </p>
        </motion.div>

        <motion.div variants={item} className="glass rounded-xl p-6 sm:p-8">
          <h2 className="font-display font-semibold text-xl text-foreground mb-3 flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" /> The Solution
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            SCENE is real-time nightlife intelligence, powered by the people who are actually there. No influencer bias. No paid promotions. Just raw, honest, live crowd data from people like you. When someone vibes a club, it shows up instantly. When people start pulling up, you know the energy is building. When the vibes hit 🔥, you know it's the spot — right now, not two hours ago.
          </p>
        </motion.div>

        <motion.div variants={item} className="glass rounded-xl p-6 sm:p-8">
          <h2 className="font-display font-semibold text-xl text-foreground mb-3 flex items-center gap-2">
            <Users className="w-6 h-6 text-accent" /> How It Works
          </h2>
          <div className="space-y-3 text-muted-foreground">
            <p><strong className="text-foreground">🔥 Vibe It:</strong> Tap to signal a club is popping. One device, one vibe, every 30 minutes — keeps it honest.</p>
            <p><strong className="text-foreground">🚗 Pulling Up:</strong> Let the community know you're on your way. Watch squads form in real-time.</p>
            <p><strong className="text-foreground">⭐ Rate & Review:</strong> Rate the DJ, the music quality, and leave honest reviews so others know what to expect.</p>
            <p><strong className="text-foreground">📊 Insights:</strong> See peak vibe times, best arrival windows, and which nights go hardest — all driven by real data.</p>
            <p><strong className="text-foreground">💡 Suggest Spots:</strong> Know a hidden gem? Suggest it. The community reviews it, and if it's legit, it goes live.</p>
          </div>
        </motion.div>

        <motion.div variants={item} className="glass rounded-xl p-6 sm:p-8">
          <h2 className="font-display font-semibold text-xl text-foreground mb-3 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-400" /> The Vision
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            SCENE isn't just an app — it's a movement. We're building the world's most honest nightlife platform, where every data point comes from real people having real nights out. No gatekeeping. No paid placements. Just the truth about where the party's at. Every city. Every night. Every vibe — tracked, shared, and celebrated.
          </p>
        </motion.div>

        <motion.div variants={item} className="glass rounded-xl p-6 sm:p-8 text-center">
          <Heart className="w-8 h-8 text-secondary mx-auto mb-3" />
          <h2 className="font-display font-semibold text-xl text-foreground mb-2">Built for the Culture</h2>
          <p className="text-muted-foreground">
            SCENE is made by nightlife lovers, for nightlife lovers. Every feature exists because someone in the community needed it. Your vibes, your reviews, your suggestions — they shape what SCENE becomes. This is your platform.
          </p>
          <div className="mt-4">
            <Link to="/">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="gradient-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-full">
                Find Your Scene 🔥
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </main>
  </div>
);

export default AboutPage;
