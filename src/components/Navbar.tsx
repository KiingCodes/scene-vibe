import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, Home, User, Heart, Shield, BarChart3, Trophy, Users, Moon, ChevronDown, Check, Lock, MoreHorizontal, Bell, Building2, Crown, ShieldCheck, CalendarDays } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useMyVenues } from '@/hooks/useVenueOwner';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/NotificationBell';
import navbarLogo from '@/assets/navbar-logo.png';
import walkMeHomeIcon from '@/assets/walkmehome-icon.png';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useLiveChatCount } from '@/hooks/useLiveChatCount';
import { useCountry, COUNTRIES } from '@/contexts/CountryContext';
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
  { path: '/chat',        icon: MessageCircle, label: 'SCENE Pulse' },
  { path: '/safety',      icon: ShieldCheck,   label: 'Walk Me Home' },
];

// Everything else lives inside the "More" sheet — one tap from the dock.
const MORE_ITEMS = [
  { path: '/crews',        icon: Users,     label: 'Crews' },
  { path: '/night-replay', icon: Moon,      label: 'Night Replay' },
  { path: '/events',       icon: CalendarDays, label: 'Events' },
  { path: '/saved',        icon: Heart,     label: 'Saved' },
  { path: '/insights',     icon: BarChart3, label: 'Insights' },
  { path: '/leaderboard',  icon: Trophy,    label: 'Leaderboard' },
  { path: '/notifications',icon: Bell,      label: 'Notifications' },
  { path: '/venue-onboarding', icon: Building2, label: 'Claim Your Venue' },
];

// Owner/admin-only destinations, surfaced inside the "More" sheet.
const ADMIN_ITEMS = [
  { path: '/admin',              icon: Shield,    label: 'Command Center' },
  { path: '/admin/super',        icon: Crown,     label: 'Super Admin' },
  { path: '/business/billing',   icon: Building2, label: 'Venue Billing' },
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
      <DropdownMenuContent align={align} className="z-50 w-72 rounded-2xl border border-cyan-500/30 bg-slate-950/90 p-4 text-white shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_25px_rgba(6,182,212,0.15)] ring-1 ring-white/10 backdrop-blur-2xl sm:p-5 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200 ease-out">
        <DropdownMenuLabel className="mb-3 border-b border-white/5 px-0 py-0 pb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyan-400/90 sm:text-[11px]">
          CHOOSE YOUR SCENE
        </DropdownMenuLabel>
        {COUNTRIES.map((c) => {
          const active = c.code === 'ZA' && country === 'ZA';
          const locked = c.code === 'ZW';
          return (
            <DropdownMenuItem
              key={c.code}
              disabled={locked}
              onClick={() => {
                if (!locked) setCountry(c.code);
              }}
              className={locked
                ? 'mt-2 cursor-not-allowed pointer-events-none rounded-xl border border-white/5 bg-white/[0.02] p-3 opacity-60 focus:bg-white/[0.02]'
                : 'gap-3 rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3 transition-all hover:border-cyan-400/50 focus:bg-cyan-950/20 focus:text-white'}
            >
              <span className="text-xl">{c.flag}</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">{c.name}</div>
                <div className="mt-0.5 text-xs text-slate-400">{c.cities.slice(0, 3).join(' • ')}</div>
              </div>
              {locked ? (
                <span className="flex items-center">
                  <span className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/20 px-2 py-0.5 text-[9px] font-bold tracking-widest text-fuchsia-300 shadow-[0_0_10px_rgba(217,70,239,0.2)]">
                    COMING SOON
                  </span>
                  <Lock className="ml-1 inline h-3 w-3 text-fuchsia-400" />
                </span>
              ) : active ? (
                <span className="rounded-full bg-cyan-500/10 p-1 text-cyan-400">
                  <Check className="h-4 w-4" />
                </span>
              ) : null}
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
  const { data: myVenues } = useMyVenues();
  const location = useLocation();
  const unread = useUnreadCount();
  const liveChat = useLiveChatCount();
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
        <Link to="/" aria-label="SCENE home" className="ml-1 flex h-8 w-20 shrink-0 items-center justify-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-24">
          <img src={navbarLogo} alt="SCENE" className="block h-auto w-full object-contain" />
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
              <Button size="sm" className="h-9 rounded-full px-3 bg-[#00e6d6] hover:bg-[#00c9bb] text-black font-bold">
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
          <div className="max-w-lg mx-auto grid grid-cols-4 gap-1 px-2 h-16">
            {PRIMARY_ITEMS.map(({ path, icon: Icon, label }) => {
              const active = isActive(path);
              const isChat = path === '/chat';
              return (
                <Link
                  key={path}
                  to={path}
                  className={`relative flex flex-col items-center justify-center gap-0.5 rounded-lg transition-colors ${
                    active ? 'text-[#00e6d6]' : 'text-white/60 hover:text-white/90'
                  }`}
                  aria-current={active ? 'page' : undefined}
                  aria-label={label}
                  title={label}
                >
                  {active && (
                    <motion.span
                      layoutId="dock-active"
                      className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-gradient-to-r from-[#00e6d6] to-[#ff2e93] shadow-[0_0_10px_rgba(0,230,214,0.9)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <div className="relative">
                    {path === '/safety' ? (
                      <img
                        src={walkMeHomeIcon}
                        alt=""
                        className={`h-6 w-6 object-contain ${active ? 'drop-shadow-[0_0_8px_rgba(0,230,214,0.8)]' : ''}`}
                      />
                    ) : (
                      <Icon className={`w-5 h-5 ${active ? 'drop-shadow-[0_0_8px_rgba(0,230,214,0.8)]' : ''}`} />
                    )}
                    {isChat && liveChat > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-r from-[#00e6d6] to-[#ff2e93] text-[9px] font-black text-black flex items-center justify-center shadow-[0_0_10px_rgba(0,230,214,0.6)]">
                        {liveChat > 99 ? '99+' : liveChat}
                      </span>
                    )}
                  </div>
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
                {!!myVenues?.length && (
                  <>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.2em] text-emerald-300/80">
                      My Venues
                    </DropdownMenuLabel>
                    {myVenues.map((v) => (
                      <DropdownMenuItem key={v.id} asChild className="focus:bg-white/5 cursor-pointer">
                        <Link to={`/venue-portal?venue=${v.id}`} className="gap-2.5 py-2 flex items-center">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm text-white/90 truncate">{v.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.2em] text-[#ff2e93]/80">
                      Admin
                    </DropdownMenuLabel>
                    {ADMIN_ITEMS.map(({ path, icon: Icon, label }) => (
                      <DropdownMenuItem key={path} asChild className="focus:bg-white/5 cursor-pointer">
                        <Link to={path} className="gap-2.5 py-2 flex items-center">
                          <Icon className="w-4 h-4 text-[#ff2e93]" />
                          <span className="text-sm text-white/90">{label}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.nav>
    </>
  );
};

export default Navbar;
