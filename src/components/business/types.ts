export interface SuperAdminStats {
  gmvCents: number;
  netProfitCents: number;
  activeVenues: number;
  pendingApprovals: number;
  checkedInNow: number;
}

export type VenueTier = "basic" | "pro" | "enterprise";

export interface VenueApproval {
  id: string;
  name: string;
  location: string;
  tier: VenueTier;
  status: "pending" | "active" | "suspended";
  verified: boolean;
}

export interface SubscriptionPlan {
  id: VenueTier;
  name: string;
  priceZar: number;
  priceUsd: number;
  tagline: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

export type SponsorAssetType =
  | "Hero Carousel Banner"
  | "First Drink On Us Voucher"
  | "Search Filter Tag"
  | "Sponsored Push Alert";

export interface SponsorshipCampaign {
  id: string;
  brand: string;
  title: string;
  assetType: SponsorAssetType;
  budgetCents: number;
  spentCents: number;
  impressions: number;
  redemptions: number;
  startDate: string;
  endDate: string;
  venues: string[];
  status: "active" | "scheduled" | "ended";
}

export interface PayoutRecord {
  id: string;
  venue: string;
  grossCents: number;
  sceneCutCents: number;
  date: string;
  status: "paid" | "processing";
}

export interface SecurityEvent {
  id: string;
  kind: "door_scan" | "transaction" | "flag";
  label: string;
  detail: string;
  at: string;
}

export const PLANS: SubscriptionPlan[] = [
  {
    id: "basic",
    name: "Basic",
    priceZar: 0,
    priceUsd: 0,
    tagline: "Get on the map",
    cta: "Current Plan",
    features: [
      "Standard venue listing",
      "Operating hours editor",
      "Check-in counter view",
      "Read-only analytics",
    ],
  },
  {
    id: "pro",
    name: "Pro Venue",
    priceZar: 499,
    priceUsd: 29,
    tagline: "Run the night",
    cta: "Upgrade to Pro Venue",
    popular: true,
    features: [
      "Everything in Basic",
      "Verified Neon Badge",
      "Live Command Center (wait-time & vibe sliders)",
      "Digital drink menu builder",
      "Weekend lineup calendar",
      "2 Flash Promos / month",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceZar: 1999,
    priceUsd: 119,
    tagline: "Own the scene",
    cta: "Upgrade to Enterprise",
    features: [
      "Everything in Pro",
      "Unlimited Flash Promos",
      "Top-carousel priority (TONIGHT'S SCENE)",
      "Full demographic analytics",
      "LinePass revenue split integration",
      "Dedicated support",
    ],
  },
];
