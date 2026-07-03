import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { MapPin, MessageCircle, Home, User, Heart, Shield, BarChart3, Trophy, Users, Calendar, Video, Moon, Sparkles, ChevronDown, Check, MoreHorizontal, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/NotificationBell';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useCountry, COUNTRIES, type CountryCode } from '@/contexts/CountryContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import "@fontsource/poppins/800.css";

// Primary bottom-dock destinations (thumb-friendly, mobile-first).
const PRIMARY_ITEMS = [
  { path: '/',            icon: Home,          label: 'Home' },
  { path: '/map',         icon: MapPin,        label: 'Map' },
  { path: '/experiences', icon: Sparkles,      label: 'Discover' },
  { path: '/chat',        icon: MessageCircle, label: 'Chat' },
];

// Everything else lives inside the "More" sheet — one tap from the dock.
const MORE_ITEMS = [
  { path: '/crews',        icon: Users,     label: 'Crews' },
  { path: '/events',       icon: Calendar,  label: 'Events' },
  { path: '/videos',       icon: Video,     label: 'Videos' },
  { path: '/night-replay', icon: Moon,      label: 'Night Replay' },
  { path: '/saved',        icon: Heart,     label: 'Saved' },
  { path: '/insights',     icon: BarChart3, label: 'Insights' },
  { path: '/leaderboard',  icon: Trophy,    label: 'Leaderboard' },
  { path: '/notifications',icon: Bell,      label: 'Notifications' },
];

const CountrySwitcher = ({ align = 'start' }: { align?: 'start' | 'end' }) => {
  const { country, setCountry, meta } = useCountry();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="group flex items-center gap-1.5 h-9 pl-1.5 pr-2 rounded-full bg-white/5 border border-white/10 hover:border-[#00e6d6]/40 transition-all"
          aria-label={`Country: ${meta.name}`}
        >
          <span className="text-base leading-none">{meta.flag}</span>
          <span className="text-[11px] font-bold text-white/90 tracking-wider">{meta.code}</span>
          <ChevronDown className="w-3 h-3 text-white/60 group-hover:text-[#00e6d6] transition-colors" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56 bg-[#0a0a0f]/95 border-white/10 backdrop-blur-xl">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.2em] text-[#00e6d6]/80">
          Choose your scene
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        {COUNTRIES.map((c) => {
          const active = c.code === country;
          return (
            <DropdownMenuItem
              key={c.code}
              onClick={() => setCountry(c.code as CountryCode)}
              className="gap-3 py-2.5 focus:bg-white/5 cursor-pointer"
            >
              <span className="text-xl">{c.flag}</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white/90">{c.name}</div>
                <div className="text-[10px] text-white/50">{c.cities.slice(0, 3).join(' • ')}</div>
              </div>
              {active && <Check className="w-4 h-4 text-[#00e6d6]" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const Navbar = () => {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const location = useLocation();
  const unread = useUnreadCount();
  const isActive = (p: string) => location.pathname === p;
  const inMore = MORE_ITEMS.some(i => i.path === location.pathname);

  return (
    <>
      {/* SLIM TOP BAR — brand-lite: country · notifications · profile.
          Height 56px; existing pages already reserve pt-20 so we stay under it. */}
      <motion.header
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-3 sm:px-4 gap-2 bg-[#0a0a0f]/85 backdrop-blur-xl border-b border-white/5"
      >
        <CountrySwitcher align="start" />
        <Link to="/" className="ml-1 font-display font-black tracking-[0.25em] text-[13px] bg-gradient-to-r from-[#00e6d6] via-[#ff2e93] to-[#facc15] bg-clip-text text-transparent">
          SCENE
        </Link>
        <div className="ml-auto flex items-center gap-1">
          {user ? (
            <>
              <NotificationBell />
              {isAdmin && (
                <Link to="/admin" aria-label="Admin">
                  <Button variant="ghost" size="icon" className={`h-9 w-9 rounded-full ${isActive('/admin') ? 'bg-[#ff2e93]/15 text-[#ff2e93]' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
                    <Shield className="w-4 h-4" />
                  </Button>
                </Link>
              )}
              <Link to="/profile" aria-label="Profile">
                <Button variant="ghost" size="icon" className={`h-9 w-9 rounded-full ${isActive('/profile') ? 'bg-[#00e6d6]/15 text-[#00e6d6]' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
                  <User className="w-4 h-4" />
                </Button>
              </Link>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="h-9 rounded-full px-3 bg-gradient-to-r from-[#00e6d6] to-[#ff2e93] text-black font-bold">
                <User className="w-4 h-4 mr-1" /> Login
              </Button>
            </Link>
          )}
        </div>
      </motion.header>

      {/* BOTTOM TAB DOCK — mobile-first primary navigation. */}
      <motion.nav
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]"
        aria-label="Primary"
      >
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#00e6d6] via-[#ff2e93] to-[#facc15] opacity-80" aria-hidden />
        <div className="bg-[#0a0a0f]/90 backdrop-blur-2xl border-t border-white/10">
          <div className="max-w-lg mx-auto grid grid-cols-5 gap-1 px-2 h-16">
            {PRIMARY_ITEMS.map(({ path, icon: Icon, label }) => {
              const active = isActive(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className={`relative flex flex-col items-center justify-center gap-0.5 rounded-lg transition-colors ${
                    active ? 'text-[#00e6d6]' : 'text-white/60 hover:text-white/90'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {active && (
                    <motion.span
                      layoutId="dock-active"
                      className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-gradient-to-r from-[#00e6d6] to-[#ff2e93] shadow-[0_0_10px_rgba(0,230,214,0.9)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-5 h-5 ${active ? 'drop-shadow-[0_0_8px_rgba(0,230,214,0.8)]' : ''}`} />
                  <span className="text-[10px] font-semibold tracking-wide">{label}</span>
                </Link>
              );
            })}

            {/* MORE menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`relative flex flex-col items-center justify-center gap-0.5 rounded-lg transition-colors ${
                    inMore ? 'text-[#ff2e93]' : 'text-white/60 hover:text-white/90'
                  }`}
                  aria-label="More"
                >
                  {inMore && (
                    <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-gradient-to-r from-[#ff2e93] to-[#facc15]" />
                  )}
                  <div className="relative">
                    <MoreHorizontal className="w-5 h-5" />
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-2 min-w-[14px] h-3.5 px-1 rounded-full bg-[#ff2e93] text-[9px] font-bold text-white flex items-center justify-center">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold tracking-wide">More</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end" className="w-56 mb-2 bg-[#0a0a0f]/95 border-white/10 backdrop-blur-xl">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                  Explore more
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                {MORE_ITEMS.map(({ path, icon: Icon, label }) => (
                  <DropdownMenuItem key={path} asChild className="focus:bg-white/5 cursor-pointer">
                    <Link to={path} className="gap-2.5 py-2 flex items-center">
                      <Icon className="w-4 h-4 text-[#00e6d6]" />
                      <span className="text-sm text-white/90">{label}</span>
                      {label === 'Notifications' && unread > 0 && (
                        <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#ff2e93] text-white">
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.nav>
    </>
  );
};

export default Navbar;
