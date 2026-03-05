import { motion } from 'framer-motion';
import { ArrowLeft, Flame, Car, Star, BarChart3, MessageCircle, Heart, Trophy, Bell, MapPin, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';

const steps = [
  { icon: Flame, color: 'text-primary', title: 'Vibe It 🔥', description: 'At a club that\'s going off? Tap "Vibe It" to let the world know. Your vibe contributes to real-time crowd levels visible to everyone. One device can vibe one club every 30 minutes — keeping it authentic.' },
  { icon: Car, color: 'text-accent', title: 'Pull Up 🚗', description: 'Heading somewhere? Hit "Pulling Up" and set your ETA. Others can see how many people are en route — watch squads form before you even arrive. The anticipation is half the fun.' },
  { icon: Star, color: 'text-secondary', title: 'Rate & Review ⭐', description: 'Had an experience? Share it. Rate the DJ out of 5, score the music quality, and leave a written review. Your honest feedback helps the community find the best nights and avoid the duds.' },
  { icon: MessageCircle, color: 'text-primary', title: 'Chat 💬', description: 'Every club has a live chat room. Coordinate with friends, ask what the vibe is like right now, or just share the energy. Real-time conversation for real-time nightlife.' },
  { icon: BarChart3, color: 'text-accent', title: 'Night Insights 📊', description: 'SCENE tracks patterns. See peak vibe hours, the best time to arrive, which days go hardest, and average ratings — all powered by community data from the last 30 days.' },
  { icon: Heart, color: 'text-destructive', title: 'Save Spots ❤️', description: 'Found a club you love? Save it. Build your personal collection of go-to spots and get notified when they start trending.' },
  { icon: Plus, color: 'text-primary', title: 'Suggest a Spot 💡', description: 'Know a hidden gem the city needs to know about? Submit it through our suggestion form. Our admin team reviews every submission, and approved spots go live with a "Community Added" badge.' },
  { icon: Trophy, color: 'text-yellow-400', title: 'Earn & Compete 🏆', description: 'Every action earns points: vibing (+5), reviews (+10), DJ ratings (+8), suggestions (+20). Level up from "Fresh Face" to "Legend" and collect badges along the way. Climb the leaderboard and prove you\'re the ultimate nightlife connoisseur.' },
  { icon: Bell, color: 'text-secondary', title: 'Stay in the Loop 🔔', description: 'SCENE sends smart notifications: when a club starts trending, when squads are forming, when someone drops a 5-star review. Never miss a legendary night again.' },
  { icon: MapPin, color: 'text-primary', title: 'Explore the Map 🗺️', description: 'See every club on an interactive map with real-time vibe indicators. Find what\'s closest, what\'s trending, and navigate directly with one tap.' },
];

const HowItWorksPage = () => (
  <div className="min-h-screen gradient-dark">
    <Navbar />
    <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
      <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-foreground">How SCENE Works</h1>
        <p className="text-muted-foreground mt-2">Your complete guide to dominating the nightlife</p>
      </motion.div>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass rounded-xl p-5 flex gap-4"
          >
            <div className={`w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center shrink-0`}>
              <step.icon className={`w-5 h-5 ${step.color}`} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground mb-1">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-center mt-10">
        <Link to="/">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="gradient-primary text-primary-foreground font-semibold px-8 py-3 rounded-full text-lg">
            Start Vibing 🔥
          </motion.button>
        </Link>
      </motion.div>
    </main>
  </div>
);

export default HowItWorksPage;
