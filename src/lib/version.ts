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
export const APP_VERSION = "1.6.0";
export const APP_RELEASED_AT = "2026-05-02T20:30:00Z";

export type VersionEntry = {
  version: string;
  date: string;
  releasedAt: string;
  highlights: string[];
};

// Only the latest version is kept — older entries are intentionally pruned.
export const VERSION_HISTORY: VersionEntry[] = [
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