import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { MapPin, MessageCircle, Home, User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Clubs' },
    { path: '/map', icon: MapPin, label: 'Map' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-sm">S</span>
          </div>
          <span className="font-display font-bold text-xl text-primary neon-text">SCENE</span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link key={path} to={path}>
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 transition-all ${location.pathname === path ? 'text-primary neon-text' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Button>
            </Link>
          ))}

          {user ? (
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Login</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
