import {
  DEVICES,
  OPEN_HOUR,
  CLOSE_HOUR,
  calculatePrice,
  generateTokenCandidate,
  tierForHours,
  type Booking,
  type BookingStatus,
  type DeviceType,
  type Member,
} from "@/lib/data";
import { KEYS, read, write, uid } from "./keys";
import { getEffectiveDevices, getAdminDevices } from "./devices";
import { getCurrentMember } from "./members";

/** Fisher–Yates shuffle — used for the random tournament draw. */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// -----------------------------------------------------------------------
// Bookings
// -----------------------------------------------------------------------
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
