import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { MapPin, MessageCircle, Home, User, LogOut, Heart, Shield, BarChart3, Trophy, Users, Calendar, Video, Moon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';
import "@fontsource/poppins/800.css";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const location = useLocation();

  const mainNav = [
    { path: '/', icon: Home, label: 'Clubs' },
    { path: '/map', icon: MapPin, label: 'Map' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/crews', icon: Users, label: 'Crews' },
    { path: '/events', icon: Calendar, label: 'Events' },
    { path: '/videos', icon: Video, label: 'Videos' },
    { path: '/night-replay', icon: Moon, label: 'Replay' },
    { path: '/saved', icon: Heart, label: 'Saved' },
    { path: '/insights', icon: BarChart3, label: 'Insights' },
    { path: '/leaderboard', icon: Trophy, label: 'Ranks' },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30"
    >
      <div className="container mx-auto px-2 sm:px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1.5 shrink-0">
          <img src={logo} alt="Scene Vibe Logo" className="w-6 h-6 object-contain" />
          <span className="font-poppins font-extrabold text-lg tracking-wider bg-gradient-to-r from-orange-400 via-pink-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent neon-glow hidden sm:inline">
            SCENE
          </span>
        </Link>

        <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
          {mainNav.map(({ path, icon: Icon, label }) => (
            <Link key={path} to={path}>
              <Button
                variant="ghost"
                size="sm"
                className={`gap-1 h-9 px-1.5 sm:px-2.5 transition-all text-[11px] sm:text-xs ${
                  location.pathname === path
                    ? 'text-primary neon-text'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden lg:inline">{label}</span>
              </Button>
            </Link>
          ))}

          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm" className={`gap-1 h-9 px-1.5 sm:px-2.5 text-[11px] sm:text-xs ${location.pathname === '/admin' ? 'text-primary neon-text' : 'text-muted-foreground hover:text-foreground'}`}>
                    <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden lg:inline">Admin</span>
                  </Button>
                </Link>
              )}
              <Link to="/profile">
                <Button variant="ghost" size="sm" className={`gap-1 h-9 px-1.5 sm:px-2.5 text-[11px] sm:text-xs ${location.pathname === '/profile' ? 'text-primary neon-text' : 'text-muted-foreground hover:text-foreground'}`}>
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden lg:inline">Profile</span>
                </Button>
              </Link>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1 h-9 px-1.5 sm:px-2.5 text-[11px] sm:text-xs">
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden lg:inline">Login</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
