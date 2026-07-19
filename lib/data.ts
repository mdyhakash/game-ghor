// LEVEL UP — static data & shared types (frontend-only build, no DB).
// This file replaces prisma/schema.prisma + prisma/seed.ts + lib/pricing.ts.
// Everything the app needs to know about devices, tiers and pricing lives here.

export type Tier = "BRONZE" | "SILVER" | "GOLD" | "DIAMOND";
export type MembershipStatus = "PENDING" | "APPROVED";
export type DeviceType = "PC" | "PS4" | "PS5";
export type DeviceStatus = "AVAILABLE" | "MAINTENANCE";
export type BookingStatus = "WAITING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export type Device = {
  id: string;
  name: string; // "PC 3", "PS5 - A"
  type: DeviceType;
  status: DeviceStatus;
  pricePerHour: number;
};

export type Member = {
  id: string;
  phone: string;
  password: string; // plaintext — fine for this frontend-only demo, never do this with a real backend
  name: string;
  tier: Tier;
  membershipStatus: MembershipStatus; // PENDING until admin approves (after payment), then APPROVED
  points: number;
  totalHours: number;
  createdAt: string;
};

export type Booking = {
  id: string;
  token: string; // short human-facing token, e.g. "014"
  deviceId: string;
  memberId?: string;
  guestPhone?: string;
  startTime: string; // ISO
  endTime: string; // ISO
  durationHrs: number;
  status: BookingStatus;
  basePrice: number;
  discountApplied: number; // fraction, e.g. 0.10
  finalPrice: number;
  pointsEarned: number;
  paid: boolean; // member points/hours are only credited once this is true (set by admin)
  createdAt: string;
};

// -----------------------------------------------------------------------
// Devices — this was prisma/seed.ts. Edit this list to add/remove machines.
// -----------------------------------------------------------------------
export const DEVICES: Device[] = [
  { id: "pc-1", name: "PC 1", type: "PC", status: "AVAILABLE", pricePerHour: 60 },
  { id: "pc-2", name: "PC 2", type: "PC", status: "AVAILABLE", pricePerHour: 60 },
  { id: "pc-3", name: "PC 3", type: "PC", status: "AVAILABLE", pricePerHour: 60 },
  { id: "pc-4", name: "PC 4", type: "PC", status: "AVAILABLE", pricePerHour: 60 },
  { id: "pc-5", name: "PC 5", type: "PC", status: "AVAILABLE", pricePerHour: 60 },
  { id: "ps5-a", name: "PS5 - A", type: "PS5", status: "AVAILABLE", pricePerHour: 100 },
  { id: "ps5-b", name: "PS5 - B", type: "PS5", status: "AVAILABLE", pricePerHour: 100 },
  { id: "ps4-a", name: "PS4 - A", type: "PS4", status: "AVAILABLE", pricePerHour: 70 },
  { id: "ps4-b", name: "PS4 - B", type: "PS4", status: "AVAILABLE", pricePerHour: 70 },
  { id: "ps4-c", name: "PS4 - C", type: "PS4", status: "AVAILABLE", pricePerHour: 70 },
];

export const DEVICE_META: Record<DeviceType, { icon: string; title: string; sub: string }> = {
  PC: { icon: "🖥️", title: "Gaming PC", sub: "RTX rigs · Valorant, CS2, Fortnite" },
  PS5: { icon: "🎮", title: "PS5", sub: "Latest titles loaded" },
  PS4: { icon: "🕹️", title: "PS4", sub: "FIFA, GTA, and more" },
};

export const TYPE_LABEL: Record<DeviceType, string> = { PC: "Gaming PC", PS4: "PS4", PS5: "PS5" };

// Cafe hours — hardcoded, tune here.
export const OPEN_HOUR = 10; // 10 AM
export const CLOSE_HOUR = 24; // midnight

export type TournamentStatus = "UPCOMING" | "ONGOING" | "COMPLETED";
export type MatchStatus = "PENDING" | "COMPLETED";

export type Tournament = {
  id: string;
  name: string;
  gameTitle: string; // e.g. "Valorant", "FIFA 25", free text
  maxPlayers: number; // power of two: 4, 8, 16, 32
  entryFee: number;
  prizePool: string; // free text, e.g. "৳5,000 + trophy"
  startDate: string; // ISO date
  description: string;
  status: TournamentStatus;
  createdAt: string;
};

export type Participant = {
  id: string;
  tournamentId: string;
  name: string;
  phone?: string;
  createdAt: string;
};

export type Match = {
  id: string;
  tournamentId: string;
  round: number; // 1 = first round
  matchIndex: number; // position within the round, 0-based
  participantAId: string | null;
  participantBId: string | null;
  winnerId: string | null;
  scoreA: number | null;
  scoreB: number | null;
  status: MatchStatus;
};

/** Smallest power of two >= n (minimum 2). Used to size the bracket. */
export function nextPowerOfTwo(n: number): number {
  let size = 2;
  while (size < n) size *= 2;
  return size;
}

// -----------------------------------------------------------------------
// Admin — this is a frontend-only demo, so "auth" is a single shared
// password rather than real accounts. Change this before sharing the app.
// -----------------------------------------------------------------------
export const ADMIN_PASSWORD = "levelup-admin";

// -----------------------------------------------------------------------
// Tiers & pricing — this was lib/pricing.ts.
// -----------------------------------------------------------------------
export const TIER_INFO: Record<
  Tier,
  { label: string; discount: number; icon: string; hoursRequired: number }
> = {
  BRONZE: { label: "Bronze member", discount: 0, icon: "🥉", hoursRequired: 0 },
  SILVER: { label: "Silver member", discount: 0.05, icon: "🥈", hoursRequired: 10 },
  GOLD: { label: "Gold member", discount: 0.1, icon: "🏆", hoursRequired: 25 },
  DIAMOND: { label: "Diamond member", discount: 0.15, icon: "💎", hoursRequired: 50 },
};

// Points earned per hour played. Feel free to tune this.
export const POINTS_PER_HOUR = 5;

/** Recompute a member's tier from their lifetime hours played. */
export function tierForHours(totalHours: number): Tier {
  if (totalHours >= TIER_INFO.DIAMOND.hoursRequired) return "DIAMOND";
  if (totalHours >= TIER_INFO.GOLD.hoursRequired) return "GOLD";
  if (totalHours >= TIER_INFO.SILVER.hoursRequired) return "SILVER";
  return "BRONZE";
}

export function calculatePrice(pricePerHour: number, durationHrs: number, tier: Tier | null) {
  const basePrice = pricePerHour * durationHrs;
  const discount = tier ? TIER_INFO[tier].discount : 0;
  const finalPrice = Math.round(basePrice * (1 - discount));
  const pointsEarned = tier ? durationHrs * POINTS_PER_HOUR : 0;
  return { basePrice, discount, finalPrice, pointsEarned };
}

/** Generates a short counter-friendly token like "014". Uniqueness against
 * existing bookings is checked by the caller (see lib/store.ts). */
export function generateTokenCandidate() {
  const n = Math.floor(Math.random() * 900 + 10); // 010-909
  return n.toString().padStart(3, "0");
}