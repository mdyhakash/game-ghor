export type Tier = "BRONZE" | "SILVER" | "GOLD" | "DIAMOND";
export type MembershipStatus = "PENDING" | "APPROVED";
export type DeviceType =
  | "PC"
  | "PS3"
  | "PS4"
  | "PS5"
  | "MOBILE"
  | "RACING"
  | "ARCADE"
  | "VR";

export const ALL_DEVICE_TYPES: DeviceType[] = [
  "PC",
  "PS3",
  "PS4",
  "PS5",
  "MOBILE",
  "RACING",
  "ARCADE",
  "VR",
];
export type DeviceStatus = "AVAILABLE" | "MAINTENANCE";
export type BookingStatus = "WAITING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export type Device = {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  pricePerHour: number;
};

export type Member = {
  id: string;
  phone: string;
  password: string;
  name: string;
  tier: Tier;
  membershipStatus: MembershipStatus;
  points: number;
  totalHours: number;
  createdAt: Date;
};

export type Booking = {
  id: string;
  token: string;
  deviceId: string;
  memberId?: string;
  guestPhone?: string;
  startTime: string;
  endTime: string;
  durationHrs: number;
  status: BookingStatus;
  basePrice: number;
  discountApplied: number;
  finalPrice: number;
  pointsEarned: number;
  paid: boolean;
  createdAt: Date;
};

export const DEVICE_META: Record<
  DeviceType,
  { iconKey: string; title: string; sub: string }
> = {
  PC: {
    iconKey: "PC",
    title: "Gaming PC",
    sub: "RTX rigs · Valorant, CS2, Fortnite",
  },

  PS5: {
    iconKey: "PS5",
    title: "PS5",
    sub: "Latest titles loaded",
  },

  PS4: {
    iconKey: "PS4",
    title: "PS4",
    sub: "FIFA, GTA, and more",
  },

  PS3: {
    iconKey: "PS3",
    title: "PS3",
    sub: "FIFA, GTA, and more",
  },

  MOBILE: {
    iconKey: "MOBILE",
    title: "Mobile",
    sub: "eFootball, Free Fire, PUBG",
  },

  RACING: {
    iconKey: "RACING",
    title: "Racing Simulator",
    sub: "Steering wheel & pedal setup",
  },

  ARCADE: {
    iconKey: "ARCADE",
    title: "Arcade Machine",
    sub: "Classic arcade games",
  },

  VR: {
    iconKey: "VR",
    title: "VR Gaming",
    sub: "Immersive virtual reality",
  },
};
// -----------------------------------------------------------------------
// Contact — placeholder number. Replace both with the real cafe number.
// -----------------------------------------------------------------------
export const CAFE_PHONE = "+8801605586019";
export const CAFE_PHONE_DISPLAY = "+8801605586019";
export const CAFE_ADDRESS = "House 12, Road 5, Dhanmondi, Dhaka";

// -----------------------------------------------------------------------
// Games — shown on the home page "Games available" section + /games page.
// No real poster art yet, so `color` drives a gradient placeholder tile.
// Add a `posterUrl` (path under /public/games/...) later to swap in real art.
// -----------------------------------------------------------------------
export type Game = {
  id: string;
  title: string;
  genre: string;
  devices: DeviceType[];
  color: string;
  posterUrl?: string;
};

export const GAMES: Game[] = [
  {
    id: "valorant",
    title: "Valorant",
    genre: "Tactical FPS",
    devices: ["PC"],
    color: "from-[#ff2e93] to-[#7c5cff]",
  },
  {
    id: "cs2",
    title: "Counter-Strike 2",
    genre: "Tactical FPS",
    devices: ["PC"],
    color: "from-[#b6ff3c] to-[#1a5c3c]",
  },
  {
    id: "fortnite",
    title: "Fortnite",
    genre: "Battle Royale",
    devices: ["PC"],
    color: "from-[#7c5cff] to-[#ff2e93]",
  },
  {
    id: "fifa25",
    title: "FIFA 25",
    genre: "Sports",
    devices: ["PS4", "PS5", "PC"],
    color: "from-[#ffcb47] to-[#ff6f3c]",
  },
  {
    id: "gta5",
    title: "GTA V",
    genre: "Open World",
    devices: ["PS4", "PS5", "PC"],
    color: "from-[#3c6bff] to-[#0c0b12]",
  },
  {
    id: "efootball",
    title: "eFootball",
    genre: "Sports",
    devices: ["PS4", "PS5"],
    color: "from-[#3cffb6] to-[#1a3c5c]",
  },
  {
    id: "godofwar",
    title: "God of War",
    genre: "Action",
    devices: ["PS5"],
    color: "from-[#a29cb8] to-[#0c0b12]",
  },
  {
    id: "pubg",
    title: "PUBG: Battlegrounds",
    genre: "Battle Royale",
    devices: ["PC"],
    color: "from-[#ffcb47] to-[#3c6bff]",
  },
];

export const TYPE_LABEL: Record<DeviceType, string> = {
  PC: "Gaming PC",
  PS3: "PS3",
  PS4: "PS4",
  PS5: "PS5",
  MOBILE: "MOBILE",
  RACING: "RACING",
  ARCADE: "ARCADE",
  VR: "VR",
};

// Cafe hours — hardcoded, tune here.
export const OPEN_HOUR = 10; // 10 AM
export const CLOSE_HOUR = 22; // midnight

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
  createdAt: Date;
};

export type Participant = {
  id: string;
  tournamentId: string;
  name: string;
  phone?: string | null;
  createdAt: Date;
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

// -----------------------------------------------------------------------
// Tiers & pricing — this was lib/pricing.ts.
// -----------------------------------------------------------------------
export const TIER_INFO: Record<
  Tier,
  { label: string; discount: number; iconKey: string; hoursRequired: number }
> = {
  BRONZE: {
    label: "Bronze member",
    discount: 0,
    iconKey: "BRONZE",
    hoursRequired: 0,
  },
  SILVER: {
    label: "Silver member",
    discount: 0.05,
    iconKey: "SILVER",
    hoursRequired: 10,
  },
  GOLD: {
    label: "Gold member",
    discount: 0.1,
    iconKey: "GOLD",
    hoursRequired: 25,
  },
  DIAMOND: {
    label: "Diamond member",
    discount: 0.15,
    iconKey: "DIAMOND",
    hoursRequired: 50,
  },
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

export function calculatePrice(
  pricePerHour: number,
  durationHrs: number,
  tier: Tier | null,
) {
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
/** Fisher–Yates shuffle — used for the random tournament draw. */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
