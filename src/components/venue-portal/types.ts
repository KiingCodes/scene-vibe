export type PortalMode = "setup" | "live";

export type CrowdTag = "Chilled" | "Warming Up" | "Vibing" | "Packed" | "Wall-to-Wall";

export interface VenueStatus {
  waitMinutes: number;
  crowdTag: CrowdTag;
  inboundPullUps: number;
}

export interface FlashPromo {
  headline: string;
  radiusKm: number;
  durationMinutes: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: "Drinks" | "Entry" | "VIP Table";
  price: number;
}

export interface LineupSlot {
  id: string;
  day: "Friday" | "Saturday" | "Sunday";
  artist: string;
  time: string;
  genre: string;
}

export interface MediaSlot {
  id: string;
  label: string;
  hint: string;
  filled: boolean;
}

export interface AnalyticsCard {
  id: string;
  label: string;
  value: string;
  delta: string;
  tone: "violet" | "cyan" | "pink";
}