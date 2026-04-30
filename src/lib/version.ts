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
export const APP_VERSION = "1.4.0";

export const VERSION_HISTORY: { version: string; date: string; highlights: string[] }[] = [
  {
    version: "1.4.0",
    date: "2026-04-30",
    highlights: [
      "Real-time Open/Closed status on club cards",
      "JewelIQ footer branding + version control",
    ],
  },
  {
    version: "1.3.0",
    date: "2026-04",
    highlights: ["Global background image", "Splash screen redesign"],
  },
  {
    version: "1.2.0",
    date: "2026-04",
    highlights: ["Carousel keyboard nav", "What's New notifications", "Trending toasts"],
  },
];