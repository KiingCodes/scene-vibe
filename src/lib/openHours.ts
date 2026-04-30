// Tolerant parser for free-form opening_hours strings.
// Returns { isOpen, label } based on the current time in the venue's local TZ (assumed Africa/Johannesburg).

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DAY_ALIASES: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, weds: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, frid: 5, friday: 5,
  sat: 6, saturday: 6,
};

function parseTime(raw: string): number | null {
  // returns minutes since 00:00, or null
  const s = raw.trim().toLowerCase().replace(/\s+/g, "");
  const m = s.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)?$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const mer = m[3];
  if (mer === "am") {
    if (h === 12) h = 0;
  } else if (mer === "pm") {
    if (h !== 12) h += 12;
  }
  if (h < 0 || h > 24 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function parseDayRange(raw: string): number[] | null {
  const s = raw.trim().toLowerCase();
  if (s === "daily" || s === "everyday" || s === "every day") return [0, 1, 2, 3, 4, 5, 6];
  // Range like mon-sun, fri-sat
  const range = s.match(/^([a-z]+)\s*[-–]\s*([a-z]+)$/);
  if (range) {
    const a = DAY_ALIASES[range[1]];
    const b = DAY_ALIASES[range[2]];
    if (a == null || b == null) return null;
    const out: number[] = [];
    let i = a;
    while (true) { out.push(i); if (i === b) break; i = (i + 1) % 7; if (out.length > 7) break; }
    return out;
  }
  // Combined like "sat&sun" or "fri,sat"
  const parts = s.split(/[&,/]+/).map(p => p.trim()).filter(Boolean);
  if (parts.length > 0 && parts.every(p => DAY_ALIASES[p] != null)) {
    return parts.map(p => DAY_ALIASES[p]);
  }
  if (DAY_ALIASES[s] != null) return [DAY_ALIASES[s]];
  return null;
}

interface Segment { days: number[]; open: number; close: number; }

function parseSegments(input: string): Segment[] {
  const segs: Segment[] = [];
  const text = input.trim();
  if (!text) return segs;
  const lower = text.toLowerCase();
  if (lower.includes("24 hour") || lower.includes("24hr") || lower === "24/7") {
    // Possibly with exception like "Open 24 Hours - Fri: Closed" — keep simple: open all days.
    return [{ days: [0,1,2,3,4,5,6], open: 0, close: 24 * 60 }];
  }

  // Split into chunks separated by " " between groups: e.g. "Fri: 3PM-5AM Sat:10PM-5AM"
  // Strategy: find all "<dayspec>: <times>" or "<dayspec> <times>" segments via regex.
  const re = /([A-Za-z][A-Za-z\-,&\/ ]*?)\s*:?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const dayPart = m[1].trim().replace(/\s+/g, "");
    const days = parseDayRange(dayPart) || [0,1,2,3,4,5,6];
    const open = parseTime(m[2]);
    let close = parseTime(m[3]);
    if (open == null || close == null) continue;
    if (close <= open) close += 24 * 60; // overnight wrap
    segs.push({ days, open, close });
  }
  return segs;
}

export interface OpenStatus { isOpen: boolean; label: string; }

export function getOpenStatus(openingHours: string | null | undefined, now: Date = new Date()): OpenStatus | null {
  if (!openingHours) return null;
  const segs = parseSegments(openingHours);
  if (segs.length === 0) return null;

  // Use Africa/Johannesburg local time
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Johannesburg",
    weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const wd = parts.find(p => p.type === "weekday")?.value.toLowerCase().slice(0, 3) || "";
  const hh = parseInt(parts.find(p => p.type === "hour")?.value || "0", 10);
  const mm = parseInt(parts.find(p => p.type === "minute")?.value || "0", 10);
  const today = DAYS.indexOf(wd);
  const nowMin = hh * 60 + mm;

  for (const seg of segs) {
    // Check today's segment
    if (seg.days.includes(today) && nowMin >= seg.open && nowMin < seg.close) {
      return { isOpen: true, label: "Open Now" };
    }
    // Check yesterday's overnight segment that extends past midnight
    if (seg.close > 24 * 60) {
      const yesterday = (today + 6) % 7;
      if (seg.days.includes(yesterday) && nowMin + 24 * 60 < seg.close && nowMin + 24 * 60 >= seg.open) {
        return { isOpen: true, label: "Open Now" };
      }
    }
  }
  return { isOpen: false, label: "Closed" };
}
