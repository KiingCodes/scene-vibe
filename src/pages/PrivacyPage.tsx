import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';

const PrivacyPage = () => (
  <div className="min-h-screen gradient-dark">
    <Navbar />
    <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
      <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div className="text-center">
          <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="font-display font-bold text-3xl text-foreground">Privacy Policy</h1>
          <p className="text-muted-foreground mt-2">Last updated: March 2026</p>
        </div>

        <div className="glass rounded-xl p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">Your Privacy Matters</h2>
            <p>SCENE was built with privacy at its core. We believe you should enjoy the nightlife without worrying about who's watching your data. Here's exactly what we collect, why, and how we protect it.</p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">What We Collect</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li><strong className="text-foreground">Account info:</strong> Email address and username when you sign up.</li>
              <li><strong className="text-foreground">Activity data:</strong> Vibes, reviews, ratings, messages, and favorites — the things you actively share with the community.</li>
              <li><strong className="text-foreground">Device identifier:</strong> A random ID stored on your device to enforce fair-use limits (like the 30-minute vibe cooldown). This is not linked to your identity.</li>
              <li><strong className="text-foreground">Usage patterns:</strong> How you navigate the app, which clubs you visit, and general interaction patterns to improve the experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">What We Don't Collect</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>We don't track your real-time GPS location continuously.</li>
              <li>We don't sell your data to advertisers. Ever.</li>
              <li>We don't share your personal information with venues.</li>
              <li>We don't store payment information (we don't have payments).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">How We Use Your Data</h2>
            <p>Everything we collect serves one purpose: making SCENE better for you and the community. Your vibes power crowd levels. Your reviews help others find great spots. Your ratings surface the best DJs. Your data makes the nightlife smarter — anonymized and aggregated.</p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">Push Notifications</h2>
            <p>SCENE sends notifications about trending clubs, squad alerts, and community updates. You can disable these at any time through your browser or device settings. We'll never spam you — every notification is designed to enhance your night out.</p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">Data Security</h2>
            <p>Your data is encrypted in transit and at rest. We use industry-standard security practices including Row-Level Security policies that ensure you can only access your own data. Our infrastructure is designed so that even in the worst case, your personal information remains protected.</p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">Your Rights</h2>
            <p>You have the right to access, modify, or delete your data at any time. Want to disappear from the leaderboard? Delete your account and all your data goes with it. No questions asked, no data retained.</p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">Cookies & Local Storage</h2>
            <p>We use local storage to remember your device ID and authentication session. That's it. No third-party tracking cookies, no ad networks, no analytics tools watching your every move.</p>
          </section>

          <div className="pt-4 border-t border-border/30">
            <p className="text-center text-muted-foreground">Your trust powers the scene. We don't take it lightly. 🔒</p>
          </div>
        </div>
      </motion.div>
    </main>
  </div>
);

export default PrivacyPage;
