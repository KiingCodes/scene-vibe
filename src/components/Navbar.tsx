import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { MapPin, MessageCircle, Home, User, Heart, Shield, BarChart3, Trophy, Users, Calendar, Video, Moon, Sparkles, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/NotificationBell';
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

const NAV_ITEMS = [
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

const CountrySwitcher = () => {
  const { country, setCountry, meta } = useCountry();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="group relative flex items-center gap-2 h-11 pl-2 pr-3 rounded-2xl bg-gradient-to-r from-[#0a0a0f]/90 via-[#101018]/90 to-[#0a0a0f]/90 border border-white/10 shadow-[0_0_20px_-8px_rgba(0,230,214,0.6)] hover:border-[#00e6d6]/40 transition-all"
          aria-label={`Country: ${meta.name}`}
        >
          <span className="text-xl leading-none drop-shadow-[0_0_6px_rgba(0,230,214,0.5)]">{meta.flag}</span>
          <span className="flex flex-col items-start leading-tight">
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#00e6d6]/80 font-semibold">Scene</span>
            <span className="text-[11px] font-bold text-white/90">{meta.code}</span>
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-white/60 group-hover:text-[#00e6d6] transition-colors" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 bg-[#0a0a0f]/95 border-white/10 backdrop-blur-xl">
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

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      {/* Layered backdrop: deep charcoal with color pulses */}
      <div className="absolute inset-0 bg-[#0a0a0f]/85 backdrop-blur-2xl" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
        style={{
          background:
            'radial-gradient(600px 60px at 15% 0%, rgba(0,230,214,0.18), transparent 60%), radial-gradient(600px 60px at 85% 100%, rgba(255,46,147,0.18), transparent 60%)',
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-[#00e6d6] via-[#ff2e93] to-[#facc15] opacity-80" aria-hidden />

      <div className="relative container mx-auto px-2 sm:px-4 h-20 flex items-center gap-3">
        {/* LEFT — Country switcher (replaces logo) */}
        <CountrySwitcher />

        {/* CENTER — Scrollable neon-underline tab rail */}
        <div className="flex-1 min-w-0 relative">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide h-full py-1">
            {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
              const active = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`relative shrink-0 flex flex-col items-center justify-center gap-0.5 h-14 px-3 sm:px-3.5 rounded-xl transition-all ${
                    active
                      ? 'text-white'
                      : 'text-white/55 hover:text-white/90'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-all ${
                      active ? 'drop-shadow-[0_0_10px_rgba(0,230,214,0.9)]' : ''
                    }`}
                  />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">{label}</span>
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute -bottom-0.5 left-2 right-2 h-[3px] rounded-full bg-gradient-to-r from-[#00e6d6] via-[#ff2e93] to-[#facc15] shadow-[0_0_12px_rgba(255,46,147,0.7)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
          {/* fade masks for horizontal overflow */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#0a0a0f] to-transparent" aria-hidden />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[#0a0a0f] to-transparent" aria-hidden />
        </div>

        {/* RIGHT — utility cluster */}
        <div className="flex items-center gap-1 shrink-0">
          {user ? (
            <>
              <NotificationBell />
              {isAdmin && (
                <Link to="/admin">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-10 w-10 rounded-xl border border-white/10 ${
                      location.pathname === '/admin'
                        ? 'bg-[#ff2e93]/15 text-[#ff2e93] border-[#ff2e93]/40'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                    aria-label="Admin"
                  >
                    <Shield className="w-4 h-4" />
                  </Button>
                </Link>
              )}
              <Link to="/profile">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-10 w-10 rounded-xl border border-white/10 ${
                    location.pathname === '/profile'
                      ? 'bg-[#00e6d6]/15 text-[#00e6d6] border-[#00e6d6]/40'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                  aria-label="Profile"
                >
                  <User className="w-4 h-4" />
                </Button>
              </Link>
            </>
          ) : (
            <Link to="/auth">
              <Button
                size="sm"
                className="h-10 rounded-xl px-4 bg-gradient-to-r from-[#00e6d6] to-[#ff2e93] text-black font-bold shadow-[0_0_20px_-6px_rgba(255,46,147,0.7)] hover:opacity-95"
              >
                <User className="w-4 h-4 mr-1.5" /> Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
