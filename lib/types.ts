import type { Tier, MembershipStatus } from "@/lib/data";
import type { DeviceModel } from "@/lib/generated/prisma/models";

export type MemberView = {
  id: string;
  name: string;
  tier: Tier;
  membershipStatus: MembershipStatus;
  points: number;
  totalHours: number;
  tierInfo: {
    label: string;
    discount: number;
    iconKey: string;
    hoursRequired: number;
  };
};

export type DeviceView = DeviceModel & { isFreeNow: boolean };

export type MatchView = {
  id: string;
  round: number;
  matchIndex: number;
  participantAId: string | null;
  participantBId: string | null;
  participantAName: string | null;
  participantBName: string | null;
  winnerId: string | null;
  winnerName: string | null;
  scoreA: number | null;
  scoreB: number | null;
  status: "PENDING" | "COMPLETED";
};
