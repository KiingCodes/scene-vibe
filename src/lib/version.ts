// SCENE App Version — bump on every major update.
// Format: MAJOR.MINOR.PATCH
//
// 🚀 VERSION BUMP WORKFLOW (follow on every significant update):
//   1. Update APP_VERSION below:
//      - MAJOR (x.0.0): breaking redesigns, removed features, schema overhauls
//      - MINOR (1.x.0): new features, new pages, meaningful UX additions
//      - PATCH (1.4.x): bug fixes, copy tweaks, small visual polish
//   2. Prepend a NEW entry to the top of VERSION_HISTORY with:
//        { version, date: "YYYY-MM-DD", highlights: ["...", "..."] }
//   3. Keep highlights short, user-facing, and benefit-led (no jargon).
//   4. The footer "What's New" modal auto-reads from this file — no other edits needed.
export const APP_VERSION = "1.9.0";
export const APP_RELEASED_AT = "2026-07-04T12:00:00Z";

export type VersionEntry = {
  version: string;
  date: string;
  releasedAt: string;
  highlights: string[];
};

// Only the latest version is kept — older entries are intentionally pruned.
export const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "1.9.0",
    date: "2026-07-04",
    releasedAt: APP_RELEASED_AT,
    highlights: [
      "Background push notifications — get pinged 3x a night, even with the app closed",
      "Fixed the blank notification icon — SCENE logo now shows in your tray properly",
      "Every notification is stamped with the app version it came from",
      "Trimmer club cards & carousels — more spots visible per scroll",
      "Real cover photos on every Zimbabwe venue (auto-synced + curated fallbacks)",
      "Personalized push for signed-in users, generic teasers for anonymous devices",
    ],
  },
  {
    version: "1.8.0",
    date: "2026-07-03",
    releasedAt: APP_RELEASED_AT,
    highlights: [
      "Bottom tab dock — one-thumb navigation, no more crowded top bar",
      "Live activity log — every vibe, favorite and check-in shows up in Notifications",
      "Toughened vibe anti-abuse — one vibe per account every 30 minutes, across devices",
      "Zimbabwe venues auto-heal missing hours/images from live sources",
      "Map directions now let you pick Drive · Walk · Transit",
      "SCENE watermark fallback whenever a venue image is missing",
      "Country switcher now filters search across every page",
    ],
  },
  {
    version: "1.7.0",
    date: "2026-05-09",
    releasedAt: APP_RELEASED_AT,
    highlights: [
      "Loading skeletons across the app — smoother feel everywhere",
      "Open / Closed status now shown on every experience",
      "Background sync — manual refresh button removed",
      "Daily reminders if you've installed SCENE — never miss a vibe",
      "Refreshed legal pages with mandatory first-open agreement",
      "Install banner now shows the SCENE logo for clarity",
    ],
  },
  {
    version: "1.6.0",
    date: "2026-05-02",
    releasedAt: APP_RELEASED_AT,
    highlights: [
      "Realtime streaming chat — new messages appear instantly",
      "Infinite scroll back through chat history",
      "Notification center 🔔 — chats, version updates & more",
      "Smarter video recorder UX with countdown ring & pause",
      "Beyond clubs: discover Parties, Workshops, Pop-ups, Markets, Food & Lounges",
      "Background sync keeps venue hours, images & info fresh",
      "Typewriter search across the app, including chat",
    ],
  },
];