import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';

const TermsPage = () => (
  <div className="min-h-screen gradient-dark">
    <Navbar />
    <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
      <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div className="text-center">
          <FileText className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="font-display font-bold text-3xl text-foreground">Terms of Service</h1>
          <p className="text-muted-foreground mt-2">Last updated: March 2026</p>
        </div>

        <div className="glass rounded-xl p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">1. Welcome to SCENE</h2>
            <p>SCENE is a real-time nightlife discovery platform built for the culture. By using our app, you agree to these terms — they exist to keep the experience safe, fair, and legendary for everyone.</p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">2. Your Account, Your Responsibility</h2>
            <p>When you create an account, you're joining a community. Your username, vibes, reviews, and ratings are your digital footprint on the nightlife map. Keep your credentials safe — you're responsible for all activity under your account. If something feels off, let us know immediately.</p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">3. The Vibe Code</h2>
            <p>SCENE thrives on authenticity. When you vibe a club, rate a DJ, or drop a review — keep it real. Fake vibes, spam, or manipulation of the system undermines the entire community. We reserve the right to remove content and suspend accounts that violate the spirit of honest, real-time nightlife reporting.</p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">4. Content You Create</h2>
            <p>Your reviews, ratings, messages, and spot suggestions remain yours. By posting on SCENE, you grant us a non-exclusive license to display, distribute, and promote your content within the platform. We'll never sell your content to third parties or use it outside the SCENE ecosystem without your consent.</p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">5. Community Spot Suggestions</h2>
            <p>SCENE is community-powered. When you suggest a new spot, it goes through our review process. We reserve the right to approve, modify, or reject submissions. Approved spots become part of the SCENE directory and may be edited for accuracy.</p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">6. Fair Use & Rate Limits</h2>
            <p>To keep SCENE fair, each device can vibe one club every 30 minutes. This prevents spam and ensures the vibe counts reflect real crowd energy. Attempting to circumvent these limits may result in account suspension.</p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">7. Points & Badges</h2>
            <p>SCENE rewards active participation through our gamification system. Points and badges are earned organically — any attempt to game the system through bots, fake accounts, or coordinated manipulation will result in point resets and potential bans.</p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">8. Disclaimer</h2>
            <p>SCENE provides real-time crowd-sourced information. We don't guarantee the accuracy of vibe counts, ratings, or crowd levels. Always exercise personal judgment and prioritize your safety when going out. SCENE is not responsible for your experiences at any venue.</p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">9. Changes to These Terms</h2>
            <p>The nightlife evolves, and so do we. We may update these terms as SCENE grows. Continued use after changes means you accept the new terms. We'll notify you of significant changes through the app.</p>
          </section>

          <div className="pt-4 border-t border-border/30">
            <p className="text-center text-muted-foreground">Questions? Reach out — we're always listening to the community. 🎶</p>
          </div>
        </div>
      </motion.div>
    </main>
  </div>
);

export default TermsPage;
