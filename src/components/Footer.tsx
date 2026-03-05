import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

const Footer = () => (
  <footer className="border-t border-border/30 bg-card/30 backdrop-blur-sm mt-12">
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
        <div>
          <h4 className="font-display font-semibold text-foreground text-sm mb-3">Explore</h4>
          <div className="space-y-2">
            <Link to="/" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Clubs</Link>
            <Link to="/map" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Map</Link>
            <Link to="/insights" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Insights</Link>
            <Link to="/leaderboard" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Leaderboard</Link>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold text-foreground text-sm mb-3">Community</h4>
          <div className="space-y-2">
            <Link to="/suggest" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Suggest a Spot</Link>
            <Link to="/chat" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Chat</Link>
            <Link to="/saved" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Saved</Link>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold text-foreground text-sm mb-3">Learn</h4>
          <div className="space-y-2">
            <Link to="/about" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">About SCENE</Link>
            <Link to="/how-it-works" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">How It Works</Link>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold text-foreground text-sm mb-3">Legal</h4>
          <div className="space-y-2">
            <Link to="/terms" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>

      <div className="border-t border-border/20 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">© 2026 SCENE. Built for the culture.</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          Made with <Heart className="w-3 h-3 text-secondary" /> for nightlife lovers
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
