import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { MapPin, MessageCircle, Home, User, LogOut, Heart, Shield, BarChart3, Trophy, Users, Calendar, Video, Moon, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/NotificationBell';
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
    { path: '/experiences', icon: Sparkles, label: 'Discover' },
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
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-background/70 border-b border-border/40 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)]"
    >
      {/* Neon gradient hairline accent */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="container mx-auto px-2 sm:px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <span className="relative">
            <span className="absolute inset-0 rounded-full blur-md bg-primary/40 opacity-70 group-hover:opacity-100 transition-opacity" aria-hidden />
            <img src={logo} alt="Scene Vibe Logo" className="relative w-7 h-7 object-contain drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
          </span>
          <span className="font-poppins font-extrabold text-lg tracking-[0.18em] bg-gradient-to-r from-orange-400 via-pink-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent neon-glow hidden sm:inline">
            SCENE
          </span>
        </Link>

        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
          {mainNav.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <Link key={path} to={path} className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-1 h-9 px-1.5 sm:px-2.5 rounded-full transition-all text-[11px] sm:text-xs ${
                    active
                      ? 'text-primary bg-primary/10 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.35)]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${active ? 'drop-shadow-[0_0_6px_hsl(var(--primary)/0.8)]' : ''}`} />
                  <span className="hidden lg:inline">{label}</span>
                </Button>
                {active && (
                  <motion.span
                    layoutId="navbar-active-dot"
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_2px_hsl(var(--primary)/0.7)]"
                  />
                )}
              </Link>
            );
          })}

          {user ? (
            <>
              <NotificationBell />
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm" className={`gap-1 h-9 px-1.5 sm:px-2.5 rounded-full text-[11px] sm:text-xs ${location.pathname === '/admin' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'}`}>
                    <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden lg:inline">Admin</span>
                  </Button>
                </Link>
              )}
              <Link to="/profile">
                <Button variant="ghost" size="sm" className={`gap-1 h-9 px-1.5 sm:px-2.5 rounded-full text-[11px] sm:text-xs ${location.pathname === '/profile' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'}`}>
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden lg:inline">Profile</span>
                </Button>
              </Link>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1 h-9 px-1.5 sm:px-2.5 rounded-full text-[11px] sm:text-xs">
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
