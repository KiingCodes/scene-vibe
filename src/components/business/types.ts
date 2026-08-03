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

export const MOCK_STATS: SuperAdminStats = {
  gmvCents: 1284500_00,
  netProfitCents: 192675_00,
  activeVenues: 148,
  pendingApprovals: 7,
  checkedInNow: 3421,
};

export const MOCK_VENUES: VenueApproval[] = [
  { id: "v1", name: "Konka Soweto", location: "Soweto, ZA", tier: "enterprise", status: "active", verified: true },
  { id: "v2", name: "Kong Bar & Lounge", location: "Sandton, ZA", tier: "pro", status: "active", verified: true },
  { id: "v3", name: "Pabloz", location: "Harare, ZW", tier: "basic", status: "pending", verified: false },
  { id: "v4", name: "The Venue Melville", location: "Johannesburg, ZA", tier: "pro", status: "pending", verified: false },
  { id: "v5", name: "Sky Villa", location: "Pretoria, ZA", tier: "basic", status: "suspended", verified: false },
  { id: "v6", name: "Club Sankayi", location: "Bulawayo, ZW", tier: "basic", status: "active", verified: false },
];

export const MOCK_CAMPAIGNS: SponsorshipCampaign[] = [
  {
    id: "c1", brand: "Heineken", title: "First Drink On Us", assetType: "First Drink On Us Voucher",
    budgetCents: 250000_00, spentCents: 163400_00, impressions: 428_900, redemptions: 3_182,
    startDate: "2026-07-01", endDate: "2026-09-30", venues: ["Konka Soweto", "Kong Bar & Lounge"], status: "active",
  },
  {
    id: "c2", brand: "Savanna", title: "Dry Nights Takeover", assetType: "Hero Carousel Banner",
    budgetCents: 120000_00, spentCents: 94100_00, impressions: 611_240, redemptions: 0,
    startDate: "2026-06-15", endDate: "2026-08-31", venues: ["All ZA venues"], status: "active",
  },
  {
    id: "c3", brand: "Red Bull", title: "Afterhours Energy", assetType: "Sponsored Push Alert",
    budgetCents: 80000_00, spentCents: 21050_00, impressions: 132_770, redemptions: 892,
    startDate: "2026-08-10", endDate: "2026-10-10", venues: ["Sky Villa", "Pabloz"], status: "scheduled",
  },
];

export const MOCK_PAYOUTS: PayoutRecord[] = [
  { id: "p1", venue: "Konka Soweto", grossCents: 84200_00, sceneCutCents: 12630_00, date: "2026-08-01", status: "paid" },
  { id: "p2", venue: "Kong Bar & Lounge", grossCents: 41800_00, sceneCutCents: 6270_00, date: "2026-08-01", status: "paid" },
  { id: "p3", venue: "The Venue Melville", grossCents: 12950_00, sceneCutCents: 1942_00, date: "2026-08-03", status: "processing" },
];