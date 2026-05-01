// Deterministic hue per user id — for premium per-user bubble tints.
const PALETTE = [
  { hue: 280, name: 'violet' },   // primary brand-ish
  { hue: 195, name: 'cyan' },
  { hue: 330, name: 'pink' },
  { hue: 150, name: 'mint' },
  { hue: 35,  name: 'amber' },
  { hue: 220, name: 'blue' },
  { hue: 12,  name: 'coral' },
  { hue: 260, name: 'indigo' },
  { hue: 90,  name: 'lime' },
  { hue: 0,   name: 'red' },
];

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function getUserColor(userId: string | null | undefined) {
  const key = userId || 'anon';
  const { hue } = PALETTE[hash(key) % PALETTE.length];
  return {
    hue,
    bubble: `hsl(${hue} 70% 22% / 0.85)`,
    border: `hsl(${hue} 90% 55% / 0.55)`,
    name:   `hsl(${hue} 90% 70%)`,
    glow:   `0 0 14px hsl(${hue} 90% 55% / 0.25)`,
  };
}