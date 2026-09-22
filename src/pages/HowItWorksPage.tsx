import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  Car,
  Check,
  Flame,
  Heart,
  MapPin,
  MessageCircle,
  Plus,
  Shield,
  ShieldCheck,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";

const audienceCards = [
  {
    icon: Flame,
    title: "For nightlife fans",
    text: "See real-time vibe levels, pulling-up counts, nearby events and crowd energy before you leave the house.",
  },
  {
    icon: Shield,
    title: "For safety-first night-outs",
    text: "Track a walk home, share a live link with a trusted person and trigger a faster response if something feels wrong.",
  },
  {
    icon: Building2,
    title: "For venue owners",
    text: "Claim your venue, manage live information and unlock a private dashboard with analytics, updates and promotions.",
  },
];

const flowSections = [
  {
    eyebrow: "1. Discover the venue feed",
    title: "Find the right place before the night starts.",
    body: "Use the venue feed to browse clubs, compare vibe intensity, check live counts and spot trending areas. Search filters let people move from broad discovery to a single venue in seconds.",
    bullets: [
      "Browse venues on the home feed and map view.",
      "See current crowd energy, pulling-up counts and recent activity.",
      "Open a venue page to check music vibe, layout and the latest community chatter.",
    ],
    icon: MapPin,
    tone: "text-primary",
  },
  {
    eyebrow: "2. Join the live energy",
    title: "Your actions feed the real-time pulse of the city.",
    body: "When you vibe a club, pull up with an ETA or leave a review, you help the whole community make better decisions. The platform rewards authentic activity instead of noise.",
    bullets: [
      "Tap Vibe It to add to the live crowd signal.",
      "Use Pulling Up to show who is heading out and when.",
      "Rate the music, leave a review and chat with the crowd in real time.",
    ],
    icon: Star,
    tone: "text-secondary",
  },
  {
    eyebrow: "3. Verified venues build trust",
    title: "Venue owners can claim and verify their listing.",
    body: "A venue owner can start by submitting a claim, confirming the business details and proving the venue is genuine. Once reviewed, the venue can be marked as verified and unlocked for business tools.",
    bullets: [
      "Submit venue details, address and proof of ownership.",
      "Confirm the geofence and upload supporting documents.",
      "Admins review and approve the venue before verification is live.",
    ],
    icon: ShieldCheck,
    tone: "text-emerald-400",
  },
  {
    eyebrow: "4. Walk Me Home keeps people safe",
    title: "A night out is safer when the route home is tracked.",
    body: "Users can set emergency contacts, create a safe PIN and share a track link with somebody they trust. If the walk stalls or a duress code is used, SCENE escalates the situation through the safety flow.",
    bullets: [
      "Choose the destination and estimated travel time.",
      "Add emergency contacts and save a safe PIN.",
      "Share the live track link from the session to someone who can watch.",
    ],
    icon: Shield,
    tone: "text-cyan-400",
  },
  {
    eyebrow: "5. B2B owner portal",
    title: "Owners get a private dashboard for operations and growth.",
    body: "Once a venue is approved, the owner can manage their listing, publish events, review trend data and update offers. It is built to give venue teams a simple operational layer without adding confusion.",
    bullets: [
      "Manage the venue profile, updates and key information.",
      "Review analytics on footfall, engagement and audience activity.",
      "Run promotions, track billing and keep the venue organised in one place.",
    ],
    icon: Building2,
    tone: "text-violet-400",
  },
];

const steps = [
  {
    icon: Flame,
    color: "text-primary",
    title: "Explore",
    text: "Browse the venue feed, filter by vibe and check what is trending near you.",
  },
  {
    icon: Car,
    color: "text-accent",
    title: "Plan",
    text: "See who is pulling up, choose your route and know the best time to go.",
  },
  {
    icon: MessageCircle,
    color: "text-primary",
    title: "Connect",
    text: "Chat with the crowd, share updates and gather real-time opinions before you arrive.",
  },
  {
    icon: Trophy,
    color: "text-yellow-400",
    title: "Earn",
    text: "Collect points, badges and leaderboard status through real engagement.",
  },
];

const smallStats = [
  { label: "Live vibe check", value: "Real-time" },
  { label: "Verified venues", value: "Claimed + reviewed" },
  { label: "Safety layer", value: "Live track + alerts" },
  { label: "Owner tools", value: "Portal access" },
];

const HowItWorksPage = () => (
  <div className="min-h-screen gradient-dark">
    <Navbar />
    <main className="container mx-auto px-4 pt-24 pb-16 max-w-6xl">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="glass rounded-3xl border border-white/10 p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-primary font-semibold mb-3">
                How SCENE works
              </p>
              <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground leading-tight">
                A nightlife platform built for discovery, trust and safety.
              </h1>
              <p className="mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
                SCENE connects people, venues and owners in one flow - from
                deciding where to go, to getting home safely, to managing a
                venue from a professional dashboard.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/">
                  <button className="gradient-primary text-primary-foreground font-semibold px-5 py-3 rounded-full text-sm">
                    Explore the app
                  </button>
                </Link>
                <Link to="/venue-onboarding">
                  <button className="border border-white/15 bg-white/5 text-foreground font-semibold px-5 py-3 rounded-full text-sm hover:bg-white/10 transition-colors">
                    Claim your venue
                  </button>
                </Link>
              </div>
            </div>

            <div className="grid gap-3">
              {smallStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                    {stat.label}
                  </div>
                  <div className="text-xl font-display font-bold text-foreground">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      <section className="mb-12 grid gap-4 md:grid-cols-3">
        {audienceCards.map(({ icon: Icon, title, text }) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-5"
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/5 border border-white/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-display font-semibold text-xl text-foreground mb-2">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {text}
            </p>
          </motion.div>
        ))}
      </section>

      <section className="space-y-6 mb-12">
        {flowSections.map(
          ({ eyebrow, title, body, bullets, icon: Icon, tone }) => (
            <motion.article
              key={eyebrow}
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35 }}
              className="glass rounded-3xl p-5 sm:p-6 lg:p-7"
            >
              <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] items-start">
                <div className="flex items-center gap-3 lg:block">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/25 shrink-0">
                    <Icon className={`h-5 w-5 ${tone}`} />
                  </div>
                  <div className="lg:mt-3">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">
                      {eyebrow}
                    </p>
                  </div>
                </div>

                <div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground leading-tight mb-3">
                    {title}
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                    {body}
                  </p>

                  <ul className="space-y-2.5">
                    {bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-2 text-sm text-foreground/90"
                      >
                        <Check className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.article>
          ),
        )}
      </section>

      <section className="mb-12">
        <div className="mb-6 text-center">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">
            The basic flow
          </p>
          <h2 className="font-display text-3xl font-bold text-foreground mt-2">
            From first tap to last call of the night
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {steps.map(({ icon: Icon, color, title, text }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="glass rounded-2xl p-5"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10">
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Step {index + 1}
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mt-2">
                {title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {text}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="glass rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">
              Why it works
            </p>
            <h2 className="font-display text-3xl font-bold text-foreground mt-2">
              One platform, multiple roles, one clear nightlife experience.
            </h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/safety">
              <button className="inline-flex items-center gap-2 gradient-primary text-primary-foreground font-semibold px-5 py-3 rounded-full text-sm">
                Try Walk Me Home <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <Link to="/venue-portal">
              <button className="inline-flex items-center gap-2 border border-white/15 bg-white/5 text-foreground font-semibold px-5 py-3 rounded-full text-sm hover:bg-white/10 transition-colors">
                Open venue portal <Building2 className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  </div>
);

export default HowItWorksPage;
