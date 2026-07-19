// LEVEL UP — client-side "database".
// No server, no Prisma: members and bookings live in the browser's
// localStorage. This replaces src/app/api/** and src/lib/auth.ts.
// Every function here is safe to call only in the browser (client components).

import {
  DEVICES,
  OPEN_HOUR,
  CLOSE_HOUR,
  TIER_INFO,
  ADMIN_PASSWORD,
  calculatePrice,
  generateTokenCandidate,
  tierForHours,
  nextPowerOfTwo,
  type Booking,
  type BookingStatus,
  type Device,
  type DeviceStatus,
  type DeviceType,
  type Member,
  type MembershipStatus,
  type Tournament,
  type TournamentStatus,
  type Participant,
  type Match,
  type MatchStatus,
} from "@/lib/data";

const KEYS = {
  members: "levelup_members",
  bookings: "levelup_bookings",
  session: "levelup_session", // current logged-in member id
  deviceOverrides: "levelup_device_overrides", // deviceId -> DeviceStatus, set by admin
  adminSession: "levelup_admin_session", // "1" when the admin is logged in
  tournaments: "levelup_tournaments",
  participants: "levelup_participants",
  matches: "levelup_matches",
};

function isBrowser() {
  return typeof window !== "undefined";
}

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** Fisher–Yates shuffle — used for the random tournament draw. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** DEVICES with any admin-set status overrides (e.g. put into MAINTENANCE) applied. */
function getEffectiveDevices(): Device[] {
  const overrides = read<Record<string, DeviceStatus>>(
    KEYS.deviceOverrides,
    {},
  );
  return DEVICES.map((d) =>
    overrides[d.id] ? { ...d, status: overrides[d.id] } : d,
  );
}

// -----------------------------------------------------------------------
// Devices (live free/busy status is derived from bookings in storage)
// -----------------------------------------------------------------------
export function getDevices(): (Device & { isFreeNow: boolean })[] {
  const devices = getEffectiveDevices();
  const bookings = read<Booking[]>(KEYS.bookings, []);
  const now = Date.now();
  return devices.map((device) => {
    const activeBooking = bookings.find(
      (b) =>
        b.deviceId === device.id &&
        (b.status === "WAITING" || b.status === "ACTIVE") &&
        new Date(b.startTime).getTime() <= now &&
        new Date(b.endTime).getTime() >= now,
    );
    return {
      ...device,
      isFreeNow: device.status === "AVAILABLE" && !activeBooking,
    };
  });
}

export function getSlots(deviceType: DeviceType) {
  const devices = getEffectiveDevices().filter(
    (d) => d.type === deviceType && d.status === "AVAILABLE",
  );
  if (devices.length === 0)
    return { pricePerHour: 0, deviceCount: 0, slots: [] };

  const pricePerHour = devices[0].pricePerHour;
  const bookings = read<Booking[]>(KEYS.bookings, []);

  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);
  const dayEnd = new Date(baseDate);
  dayEnd.setHours(23, 59, 59, 999);

  const todaysBookings = bookings.filter((b) => {
    const device = DEVICES.find((d) => d.id === b.deviceId);
    if (!device || device.type !== deviceType) return false;
    if (b.status !== "WAITING" && b.status !== "ACTIVE") return false;
    const start = new Date(b.startTime);
    return start >= baseDate && start <= dayEnd;
  });

  const slots = [];
  for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
    const slotStart = new Date(baseDate);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(hour + 1, 0, 0, 0);
    const isPast = slotStart.getTime() < Date.now();

    const busyDeviceIds = new Set(
      todaysBookings
        .filter(
          (b) =>
            slotStart < new Date(b.endTime) && slotEnd > new Date(b.startTime),
        )
        .map((b) => b.deviceId),
    );
    const freeDevices = devices.length - busyDeviceIds.size;

    slots.push({
      startTime: slotStart.toISOString(),
      label: slotStart.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      available: freeDevices > 0 && !isPast,
    });
  }

  return { pricePerHour, deviceCount: devices.length, slots };
}

// -----------------------------------------------------------------------
// Auth — plaintext password compare, session = member id in localStorage.
// This is fine for a frontend-only demo; do NOT ship this as real auth.
// -----------------------------------------------------------------------
export function getCurrentMember(): Member | null {
  const memberId = read<string | null>(KEYS.session, null);
  if (!memberId) return null;
  const members = read<Member[]>(KEYS.members, []);
  return members.find((m) => m.id === memberId) ?? null;
}

export function getCurrentMemberView() {
  const member = getCurrentMember();
  if (!member) return null;
  return {
    id: member.id,
    name: member.name,
    tier: member.tier,
    membershipStatus: member.membershipStatus,
    points: member.points,
    totalHours: member.totalHours,
    tierInfo: TIER_INFO[member.tier],
  };
}

export function signup(
  name: string,
  phone: string,
  password: string,
): { error: string } | { member: Member } {
  if (name.trim().length < 2) return { error: "Enter your name" };
  if (!/^01[0-9]{9}$/.test(phone.trim()))
    return { error: "Enter a valid 11-digit phone number" };
  if (password.length < 4)
    return { error: "Password must be at least 4 characters" };

  const members = read<Member[]>(KEYS.members, []);
  if (members.some((m) => m.phone === phone.trim())) {
    return {
      error: "This phone number is already a member. Try logging in instead.",
    };
  }

  const member: Member = {
    id: uid(),
    phone: phone.trim(),
    password,
    name: name.trim(),
    tier: "BRONZE",
    membershipStatus: "PENDING",
    points: 0,
    totalHours: 0,
    createdAt: new Date().toISOString(),
  };
  write(KEYS.members, [...members, member]);
  write(KEYS.session, member.id);
  return { member };
}

export function login(
  phone: string,
  password: string,
): { error: string } | { member: Member } {
  if (!phone.trim()) return { error: "Enter your phone number" };
  if (!password) return { error: "Enter your password" };

  const members = read<Member[]>(KEYS.members, []);
  const member = members.find((m) => m.phone === phone.trim());
  if (!member || member.password !== password) {
    return { error: "Wrong phone number or password" };
  }
  write(KEYS.session, member.id);
  return { member };
}

export function logout() {
  write(KEYS.session, null);
}

// -----------------------------------------------------------------------
// Bookings
// -----------------------------------------------------------------------
export function createBooking(input: {
  deviceType: DeviceType;
  startTime: string;
  durationHrs: number;
  guestPhone?: string;
}): { error: string } | { booking: Booking } {
  const { deviceType, startTime, durationHrs, guestPhone } = input;

  const member = getCurrentMember();
  if (!member && !guestPhone) {
    return { error: "Enter a phone number, or log in as a member." };
  }
  if (!member && guestPhone && !/^01[0-9]{9}$/.test(guestPhone.trim())) {
    return { error: "Enter a valid 11-digit phone number" };
  }

  const start = new Date(startTime);
  const end = new Date(start.getTime() + durationHrs * 60 * 60 * 1000);

  const candidates = getEffectiveDevices().filter(
    (d) => d.type === deviceType && d.status === "AVAILABLE",
  );
  if (candidates.length === 0) {
    return { error: "No devices of this type available" };
  }

  const bookings = read<Booking[]>(KEYS.bookings, []);
  const overlapping = bookings.filter(
    (b) =>
      candidates.some((c) => c.id === b.deviceId) &&
      (b.status === "WAITING" || b.status === "ACTIVE") &&
      new Date(b.startTime) < end &&
      new Date(b.endTime) > start,
  );
  const busyIds = new Set(overlapping.map((b) => b.deviceId));
  const device = candidates.find((d) => !busyIds.has(d.id));

  if (!device) {
    return { error: "That slot was just taken. Pick another one." };
  }

  // Pending members book like guests — no discount, no points — until admin approves.
  const effectiveTier =
    member && member.membershipStatus === "APPROVED" ? member.tier : null;
  const { basePrice, discount, finalPrice, pointsEarned } = calculatePrice(
    device.pricePerHour,
    durationHrs,
    effectiveTier,
  );

  let token = generateTokenCandidate();
  for (let attempt = 0; attempt < 5; attempt++) {
    if (!bookings.some((b) => b.token === token)) break;
    token = generateTokenCandidate();
  }

  const booking: Booking = {
    id: uid(),
    token,
    deviceId: device.id,
    memberId: member?.id,
    guestPhone: member ? undefined : guestPhone?.trim(),
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    durationHrs,
    status: "WAITING",
    basePrice,
    discountApplied: discount,
    finalPrice,
    pointsEarned,
    paid: false,
    createdAt: new Date().toISOString(),
  };

  write(KEYS.bookings, [...bookings, booking]);

  // Note: member points/hours are NOT credited here — only once an admin
  // marks the booking as paid (see markBookingPaid below).

  return { booking };
}

export function getBookingById(id: string) {
  const bookings = read<Booking[]>(KEYS.bookings, []);
  const booking = bookings.find((b) => b.id === id);
  if (!booking) return null;

  const device = DEVICES.find((d) => d.id === booking.deviceId) ?? null;
  const members = read<Member[]>(KEYS.members, []);
  const member = booking.memberId
    ? (members.find((m) => m.id === booking.memberId) ?? null)
    : null;

  return { booking, device, member };
}

export function getMyBookings() {
  const member = getCurrentMember();
  if (!member) return null;
  const bookings = read<Booking[]>(KEYS.bookings, []);
  return bookings
    .filter((b) => b.memberId === member.id)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .map((b) => ({
      ...b,
      device: DEVICES.find((d) => d.id === b.deviceId) ?? null,
    }));
}

// -----------------------------------------------------------------------
// Admin — single shared password (see ADMIN_PASSWORD in lib/data.ts),
// session is just a flag in localStorage. Frontend-only demo, not real auth.
// -----------------------------------------------------------------------
export function isAdminLoggedIn(): boolean {
  return read<boolean>(KEYS.adminSession, false);
}

export function adminLogin(password: string): { error: string } | { ok: true } {
  if (password !== ADMIN_PASSWORD) return { error: "Wrong admin password" };
  write(KEYS.adminSession, true);
  return { ok: true };
}

export function adminLogout() {
  write(KEYS.adminSession, false);
}

export function getAdminDevices() {
  return getDevices(); // same live free/busy view the customer site uses
}

export function setDeviceStatus(deviceId: string, status: DeviceStatus) {
  const overrides = read<Record<string, DeviceStatus>>(
    KEYS.deviceOverrides,
    {},
  );
  write(KEYS.deviceOverrides, { ...overrides, [deviceId]: status });
}

export function getAllBookings() {
  const bookings = read<Booking[]>(KEYS.bookings, []);
  const members = read<Member[]>(KEYS.members, []);
  return bookings
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .map((b) => {
      const member = b.memberId
        ? (members.find((m) => m.id === b.memberId) ?? null)
        : null;
      return {
        ...b,
        device: DEVICES.find((d) => d.id === b.deviceId) ?? null,
        customerLabel: member
          ? member.name
          : b.guestPhone
            ? `Guest · ${b.guestPhone}`
            : "Guest",
      };
    });
}

export function updateBookingStatus(id: string, status: BookingStatus) {
  const bookings = read<Booking[]>(KEYS.bookings, []);
  write(
    KEYS.bookings,
    bookings.map((b) => {
      if (b.id !== id) return b;
      if (status === "ACTIVE") {
        // Start the session timer fresh from right now, for the booked duration —
        // this is what the admin dashboard's countdown is based on.
        const start = new Date();
        const end = new Date(start.getTime() + b.durationHrs * 60 * 60 * 1000);
        return {
          ...b,
          status,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        };
      }
      return { ...b, status };
    }),
  );
}

/** Marks a booking as paid. If it belongs to a member, this is the moment
 * their points and hours (and therefore tier) are actually credited — not
 * at booking time. Safe to call twice; only credits once. */
export function markBookingPaid(id: string) {
  const bookings = read<Booking[]>(KEYS.bookings, []);
  const booking = bookings.find((b) => b.id === id);
  if (!booking || booking.paid) return;

  write(
    KEYS.bookings,
    bookings.map((b) => (b.id === id ? { ...b, paid: true } : b)),
  );

  if (booking.memberId) {
    const members = read<Member[]>(KEYS.members, []);
    const member = members.find((m) => m.id === booking.memberId);
    if (member) {
      const newTotalHours = member.totalHours + booking.durationHrs;
      write(
        KEYS.members,
        members.map((m) =>
          m.id === member.id
            ? {
                ...m,
                points: m.points + booking.pointsEarned,
                totalHours: newTotalHours,
                tier: tierForHours(newTotalHours),
              }
            : m,
        ),
      );
    }
  }
}

/** Current price/hr for a device type, used for the admin walk-in form preview. */
export function getDeviceTypePrice(deviceType: DeviceType): number {
  const devices = getEffectiveDevices().filter(
    (d) => d.type === deviceType && d.status === "AVAILABLE",
  );
  return devices[0]?.pricePerHour ?? 0;
}

/** Admin-side booking for a walk-in customer at the counter: no member
 * account, no slot picker — assigns the first free device of that type
 * right now and marks the session ACTIVE immediately (so its timer starts). */
export function createWalkInBooking(input: {
  deviceType: DeviceType;
  durationHrs: number;
  guestPhone?: string;
}): { error: string } | { booking: Booking } {
  const { deviceType, durationHrs, guestPhone } = input;
  const phone = guestPhone?.trim();
  if (phone && !/^01[0-9]{9}$/.test(phone)) {
    return { error: "Enter a valid 11-digit phone number, or leave it blank" };
  }

  const start = new Date();
  const end = new Date(start.getTime() + durationHrs * 60 * 60 * 1000);

  const candidates = getEffectiveDevices().filter(
    (d) => d.type === deviceType && d.status === "AVAILABLE",
  );
  if (candidates.length === 0) {
    return { error: "No devices of this type available" };
  }

  const bookings = read<Booking[]>(KEYS.bookings, []);
  const overlapping = bookings.filter(
    (b) =>
      candidates.some((c) => c.id === b.deviceId) &&
      (b.status === "WAITING" || b.status === "ACTIVE") &&
      new Date(b.startTime) < end &&
      new Date(b.endTime) > start,
  );
  const busyIds = new Set(overlapping.map((b) => b.deviceId));
  const device = candidates.find((d) => !busyIds.has(d.id));

  if (!device) {
    return { error: "No free device of this type right now" };
  }

  const { basePrice, discount, finalPrice, pointsEarned } = calculatePrice(
    device.pricePerHour,
    durationHrs,
    null,
  );

  let token = generateTokenCandidate();
  for (let attempt = 0; attempt < 5; attempt++) {
    if (!bookings.some((b) => b.token === token)) break;
    token = generateTokenCandidate();
  }

  const booking: Booking = {
    id: uid(),
    token,
    deviceId: device.id,
    guestPhone: phone || undefined,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    durationHrs,
    status: "ACTIVE",
    basePrice,
    discountApplied: discount,
    finalPrice,
    pointsEarned,
    paid: false,
    createdAt: new Date().toISOString(),
  };

  write(KEYS.bookings, [...bookings, booking]);
  return { booking };
}

export function getAdminStats() {
  const bookings = read<Booking[]>(KEYS.bookings, []);
  const members = read<Member[]>(KEYS.members, []);
  const devices = getAdminDevices();

  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);
  const todaysBookings = bookings.filter(
    (b) => new Date(b.createdAt) >= baseDate,
  );

  return {
    devicesFree: devices.filter((d) => d.isFreeNow).length,
    devicesTotal: devices.length,
    bookingsToday: todaysBookings.length,
    revenueToday: todaysBookings.reduce((sum, b) => sum + b.finalPrice, 0),
    totalMembers: members.length,
  };
}

// -----------------------------------------------------------------------
// Admin — members tab
// -----------------------------------------------------------------------
export function getAllMembers() {
  const members = read<Member[]>(KEYS.members, []);
  const bookings = read<Booking[]>(KEYS.bookings, []);
  return members
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .map((m) => {
      const memberBookings = bookings.filter((b) => b.memberId === m.id);
      return {
        id: m.id,
        name: m.name,
        phone: m.phone,
        points: m.points,
        membershipStatus: m.membershipStatus,
        createdAt: m.createdAt,
        visitCount: memberBookings.length,
      };
    });
}

export function getMemberDetail(memberId: string) {
  const members = read<Member[]>(KEYS.members, []);
  const member = members.find((m) => m.id === memberId);
  if (!member) return null;

  const bookings = read<Booking[]>(KEYS.bookings, [])
    .filter((b) => b.memberId === memberId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .map((b) => ({
      ...b,
      device: DEVICES.find((d) => d.id === b.deviceId) ?? null,
    }));

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const visitsLast30Days = bookings.filter(
    (b) => new Date(b.createdAt).getTime() >= thirtyDaysAgo,
  ).length;

  return {
    member,
    bookings,
    visitCount: bookings.length,
    lastVisit: bookings[0]?.createdAt ?? null,
    visitsLast30Days,
  };
}

export function approveMembership(memberId: string) {
  const members = read<Member[]>(KEYS.members, []);
  write(
    KEYS.members,
    members.map(
      (m): Member =>
        m.id === memberId
          ? { ...m, membershipStatus: "APPROVED" as MembershipStatus }
          : m,
    ),
  );
}

// -----------------------------------------------------------------------
// Tournaments — public read functions (used by the /tournaments pages)
// and admin management (create tournament, add players, auto-generate a
// single-elimination bracket, and record match results as it progresses).
// -----------------------------------------------------------------------
const DEMO_SEEDED_KEY = "levelup_demo_tournament_seeded";

/** One-time demo tournament so the /tournaments UI isn't empty on first
 * load. Runs at most once per browser (flagged in localStorage) and never
 * re-adds itself, so deleting/editing the demo data is safe. */
function seedDemoTournamentIfNeeded() {
  if (!isBrowser()) return;
  if (window.localStorage.getItem(DEMO_SEEDED_KEY)) return;
  window.localStorage.setItem(DEMO_SEEDED_KEY, "1");

  const created = createTournament({
    name: "Valorant Clash — Season 1",
    gameTitle: "Valorant",
    maxPlayers: 8,
    entryFee: 200,
    prizePool: "৳5,000 + trophy",
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    description:
      "Demo tournament (seeded automatically) — 8-player single elimination bracket.",
  });
  if ("error" in created) return;

  const demoPlayers = [
    "Rafi",
    "Nabil",
    "Shuvo",
    "Tanvir",
    "Arif",
    "Mahin",
    "Fahim",
    "Rakib",
  ];
  for (const name of demoPlayers) {
    addParticipant(created.tournament.id, name);
  }
  generateFixture(created.tournament.id);
}
export function getTournaments() {
  seedDemoTournamentIfNeeded();
  const tournaments = read<Tournament[]>(KEYS.tournaments, []);
  const participants = read<Participant[]>(KEYS.participants, []);
  return tournaments
    .slice()
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    )
    .map((t) => ({
      ...t,
      participantCount: participants.filter((p) => p.tournamentId === t.id)
        .length,
    }));
}

export function getTournamentDetail(id: string) {
  const tournaments = read<Tournament[]>(KEYS.tournaments, []);
  const tournament = tournaments.find((t) => t.id === id);
  if (!tournament) return null;

  const participants = read<Participant[]>(KEYS.participants, []).filter(
    (p) => p.tournamentId === id,
  );
  const nameOf = (pid: string | null) =>
    pid ? (participants.find((p) => p.id === pid)?.name ?? "Unknown") : null;

  const matches = read<Match[]>(KEYS.matches, [])
    .filter((m) => m.tournamentId === id)
    .sort((a, b) => a.round - b.round || a.matchIndex - b.matchIndex)
    .map((m) => ({
      ...m,
      participantAName: nameOf(m.participantAId),
      participantBName: nameOf(m.participantBId),
      winnerName: nameOf(m.winnerId),
    }));

  const roundsCount =
    matches.length > 0 ? Math.max(...matches.map((m) => m.round)) : 0;
  const rounds = Array.from({ length: roundsCount }, (_, i) => ({
    round: i + 1,
    matches: matches.filter((m) => m.round === i + 1),
  }));

  return { tournament, participants, rounds };
}

export function createTournament(input: {
  name: string;
  gameTitle: string;
  maxPlayers: number;
  entryFee: number;
  prizePool: string;
  startDate: string;
  description: string;
}): { error: string } | { tournament: Tournament } {
  const {
    name,
    gameTitle,
    maxPlayers,
    entryFee,
    prizePool,
    startDate,
    description,
  } = input;
  if (!name.trim()) return { error: "Enter a tournament name" };
  if (![4, 8, 16, 32].includes(maxPlayers))
    return { error: "Max players must be 4, 8, 16, or 32" };
  if (!startDate) return { error: "Pick a start date" };

  const tournament: Tournament = {
    id: uid(),
    name: name.trim(),
    gameTitle: gameTitle.trim() || "Custom",
    maxPlayers,
    entryFee: entryFee || 0,
    prizePool: prizePool.trim(),
    startDate,
    description: description.trim(),
    status: "UPCOMING",
    createdAt: new Date().toISOString(),
  };

  const tournaments = read<Tournament[]>(KEYS.tournaments, []);
  write(KEYS.tournaments, [...tournaments, tournament]);
  return { tournament };
}

export function addParticipant(
  tournamentId: string,
  name: string,
  phone?: string,
): { error: string } | { participant: Participant } {
  if (!name.trim()) return { error: "Enter a player/team name" };

  const tournaments = read<Tournament[]>(KEYS.tournaments, []);
  const tournament = tournaments.find((t) => t.id === tournamentId);
  if (!tournament) return { error: "Tournament not found" };
  if (tournament.status !== "UPCOMING")
    return { error: "Fixture already generated — can't add players now" };

  const participants = read<Participant[]>(KEYS.participants, []);
  const count = participants.filter(
    (p) => p.tournamentId === tournamentId,
  ).length;
  if (count >= tournament.maxPlayers) return { error: "Tournament is full" };

  const participant: Participant = {
    id: uid(),
    tournamentId,
    name: name.trim(),
    phone: phone?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  write(KEYS.participants, [...participants, participant]);
  return { participant };
}

export function removeParticipant(tournamentId: string, participantId: string) {
  const tournaments = read<Tournament[]>(KEYS.tournaments, []);
  const tournament = tournaments.find((t) => t.id === tournamentId);
  if (tournament && tournament.status !== "UPCOMING") return; // fixture already made — don't allow removal

  const participants = read<Participant[]>(KEYS.participants, []);
  write(
    KEYS.participants,
    participants.filter((p) => p.id !== participantId),
  );
}

/** Automatic fixture maker: randomly draws the current participants into a
 * single-elimination bracket, padding with byes up to the next power of two,
 * and auto-advances anyone who drew a bye straight into round 2. */
export function generateFixture(
  tournamentId: string,
): { error: string } | { ok: true } {
  const tournaments = read<Tournament[]>(KEYS.tournaments, []);
  const tournament = tournaments.find((t) => t.id === tournamentId);
  if (!tournament) return { error: "Tournament not found" };

  const participants = read<Participant[]>(KEYS.participants, []).filter(
    (p) => p.tournamentId === tournamentId,
  );
  if (participants.length < 2)
    return { error: "Need at least 2 participants to generate a fixture" };

  const bracketSize = nextPowerOfTwo(participants.length);
  const totalRounds = Math.log2(bracketSize);

  // Random draw: shuffle participants, pad with byes, then shuffle again so
  // byes land in random slots instead of always at the end of the bracket.
  const shuffledIds = shuffle(participants.map((p) => p.id));
  const slots: (string | null)[] = [
    ...shuffledIds,
    ...Array(bracketSize - shuffledIds.length).fill(null),
  ];
  const shuffledSlots = shuffle(slots);

  const newMatches: Match[] = [];

  // Round 1 — real pairings (and byes)
  for (let i = 0; i < bracketSize / 2; i++) {
    const a = shuffledSlots[i * 2];
    const b = shuffledSlots[i * 2 + 1];
    const isBye = !a || !b;
    newMatches.push({
      id: uid(),
      tournamentId,
      round: 1,
      matchIndex: i,
      participantAId: a,
      participantBId: b,
      winnerId: isBye ? (a ?? b) : null,
      scoreA: null,
      scoreB: null,
      status: isBye ? "COMPLETED" : "PENDING",
    });
  }

  // Later rounds — empty placeholders, filled in as earlier rounds finish
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round);
    for (let i = 0; i < matchesInRound; i++) {
      newMatches.push({
        id: uid(),
        tournamentId,
        round,
        matchIndex: i,
        participantAId: null,
        participantBId: null,
        winnerId: null,
        scoreA: null,
        scoreB: null,
        status: "PENDING",
      });
    }
  }

  // Propagate round-1 byes straight into round 2
  if (totalRounds >= 2) {
    for (const m of newMatches.filter((m) => m.round === 1 && m.winnerId)) {
      const next = newMatches.find(
        (n) => n.round === 2 && n.matchIndex === Math.floor(m.matchIndex / 2),
      );
      if (next) {
        if (m.matchIndex % 2 === 0) next.participantAId = m.winnerId;
        else next.participantBId = m.winnerId;
      }
    }
  }

  // Replace any existing matches for this tournament with the fresh bracket
  const allMatches = read<Match[]>(KEYS.matches, []).filter(
    (m) => m.tournamentId !== tournamentId,
  );
  write(KEYS.matches, [...allMatches, ...newMatches]);

  write(
    KEYS.tournaments,
    tournaments.map((t) =>
      t.id === tournamentId
        ? { ...t, status: "ONGOING" as TournamentStatus }
        : t,
    ),
  );

  return { ok: true };
}

export function recordMatchResult(
  tournamentId: string,
  matchId: string,
  winnerId: string,
  scoreA?: number,
  scoreB?: number,
): { error: string } | { ok: true } {
  const matches = read<Match[]>(KEYS.matches, []);
  const match = matches.find(
    (m) => m.id === matchId && m.tournamentId === tournamentId,
  );
  if (!match) return { error: "Match not found" };
  if (!match.participantAId || !match.participantBId)
    return { error: "Both players aren't set yet" };
  if (winnerId !== match.participantAId && winnerId !== match.participantBId) {
    return { error: "Winner must be one of the two players" };
  }

  let updated = matches.map((m) =>
    m.id === matchId
      ? {
          ...m,
          winnerId,
          status: "COMPLETED" as MatchStatus,
          scoreA: scoreA ?? null,
          scoreB: scoreB ?? null,
        }
      : m,
  );

  const tournaments = read<Tournament[]>(KEYS.tournaments, []);
  const tournament = tournaments.find((t) => t.id === tournamentId);
  const participantCount = read<Participant[]>(KEYS.participants, []).filter(
    (p) => p.tournamentId === tournamentId,
  ).length;
  const bracketSize =
    participantCount > 0 ? nextPowerOfTwo(participantCount) : 0;
  const totalRounds = bracketSize > 1 ? Math.log2(bracketSize) : 0;

  // Advance the winner into their next-round slot, if there is one
  if (match.round < totalRounds) {
    const nextRound = match.round + 1;
    const nextIndex = Math.floor(match.matchIndex / 2);
    updated = updated.map((m) => {
      if (
        m.tournamentId !== tournamentId ||
        m.round !== nextRound ||
        m.matchIndex !== nextIndex
      )
        return m;
      return match.matchIndex % 2 === 0
        ? { ...m, participantAId: winnerId }
        : { ...m, participantBId: winnerId };
    });
  }

  write(KEYS.matches, updated);

  // That was the final — the tournament is over
  if (match.round === totalRounds && tournament) {
    write(
      KEYS.tournaments,
      tournaments.map((t) =>
        t.id === tournamentId
          ? { ...t, status: "COMPLETED" as TournamentStatus }
          : t,
      ),
    );
  }

  return { ok: true };
}
