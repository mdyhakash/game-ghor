import {
  TIER_INFO,
  DEVICES,
  type Member,
  type MembershipStatus,
  type Booking,
} from "@/lib/data";
import { KEYS, read, write, uid } from "./keys";

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
