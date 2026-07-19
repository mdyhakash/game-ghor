"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import GameIcon from "@/components/GameIcon";
import { TIER_INFO } from "@/lib/data";
import { getBookingById } from "@/lib/store";
import { RiArrowLeftLine, RiFireLine, RiAlertLine, RiTimeLine } from "react-icons/ri";

type BookingView = NonNullable<ReturnType<typeof getBookingById>>;

export default function TokenPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<BookingView | null | undefined>(undefined);

  useEffect(() => {
    queueMicrotask(() => {
      setData(getBookingById(params.id));
    });
  }, [params.id]);

  if (data === undefined) {
    return <div className="p-6 text-text-dim text-sm">Loading…</div>;
  }

  if (data === null || !data.device) {
    return (
      <div className="pb-6 md:max-w-md md:mx-auto md:mt-6">
        <div className="px-[18px] md:px-0 pt-[18px] pb-2.5 font-display text-xl">
          Token not found
        </div>
        <div className="text-center px-8 py-16 text-text-dim text-[13.5px]">
          This token doesn&apos;t exist, or your browser data was cleared.
        </div>
        <Link
          href="/"
          className="mx-[18px] md:mx-0 block text-center py-3.5 rounded-[14px] border border-line text-text font-semibold text-sm"
        >
          Back to home
        </Link>
        <BottomNav />
      </div>
    );
  }

  const { booking, device, member } = data;
  const startLabel = new Date(booking.startTime).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const endLabel = new Date(booking.endTime).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const tierInfo =
    member && member.membershipStatus === "APPROVED"
      ? TIER_INFO[member.tier]
      : null;

  return (
    <div className="pb-6 md:max-w-md md:mx-auto md:mt-6">
      <div className="flex items-center gap-2.5 px-[18px] md:px-0 pt-4 pb-1.5">
        <Link
          href="/"
          className="w-[34px] h-[34px] rounded-[10px] bg-card border border-line flex items-center justify-center"
        >
          <RiArrowLeftLine size={18} />
        </Link>
        <div>
          <div className="font-display text-lg font-bold flex items-center gap-1.5">
            You&apos;re locked in <RiFireLine size={18} className="text-orange-400" />
          </div>
          <div className="text-xs text-text-dim">
            Show this token at the counter
          </div>
        </div>
      </div>

      <div className="px-[18px] md:px-0 pt-5 flex flex-col items-center stamp-in">
        <div className="w-full rounded-[20px] p-[22px] bg-card border border-line relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[11px] text-text-dim tracking-wider uppercase">
                Your token
              </div>
              <div className="font-display text-5xl font-bold text-lime leading-none mt-1">
                #{booking.token}
              </div>
            </div>
            <div
              className="w-16 h-16 rounded-xl opacity-90"
              style={{
                background:
                  "repeating-linear-gradient(45deg, #2a2635 0 4px, transparent 4px 8px), repeating-linear-gradient(-45deg, #2a2635 0 4px, transparent 4px 8px)",
                backgroundBlendMode: "screen",
              }}
            />
          </div>

          {member && tierInfo && (
            <div className="flex items-center justify-between mt-3.5 bg-[var(--gold-dim)] border border-gold rounded-[10px] px-3 py-2">
              <span className="text-[12.5px] font-bold text-gold flex items-center gap-1.5">
                <GameIcon iconKey={tierInfo.iconKey} size={14} /> {tierInfo.label}
              </span>
              <span className="text-[11.5px] text-gold">
                +{booking.pointsEarned} pts earned
              </span>
            </div>
          )}
          {member && !tierInfo && (
            <div className="mt-3.5 bg-bg-soft border border-line rounded-[10px] px-3 py-2 text-[11.5px] text-text-dim flex items-center gap-1.5">
              <RiTimeLine size={14} /> Membership pending approval — discount and points apply once
              approved.
            </div>
          )}

          <div className="border-t border-dashed border-line my-4" />

          <div className="flex flex-col gap-2.5 text-[13.5px]">
            <div className="flex justify-between">
              <span className="text-text-dim">Device</span>
              <span className="font-semibold">
                {device.name} · assigned on arrival
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Time</span>
              <span className="font-semibold">
                {startLabel} – {endLabel}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Duration</span>
              <span className="font-semibold">
                {booking.durationHrs} hour{booking.durationHrs > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Price</span>
              <span className="font-semibold">
                {booking.discountApplied > 0
                  ? `৳${booking.finalPrice} (was ৳${booking.basePrice})`
                  : `৳${booking.finalPrice}`}
              </span>
            </div>
            <div className="self-start mt-1 text-[11.5px] font-bold px-3 py-1 rounded-full bg-[var(--lime-dim)] text-lime">
              CONFIRMED
            </div>
          </div>
        </div>

        <div className="mt-4 w-full rounded-[14px] border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <p className="text-[12.5px] text-amber-300">
            <span className="font-bold flex items-center gap-1"><RiAlertLine size={14} /> Important:</span> If you arrive more
            than <span className="font-semibold">10 minutes late</span> after
            your scheduled booking time, your booking will be{" "}
            <span className="font-bold">automatically cancelled</span>.
          </p>
        </div>

        <Link
          href="/"
          className="mt-4 w-full text-center py-3.5 rounded-[14px] border border-line text-text font-semibold text-sm"
        >
          Back to home
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
