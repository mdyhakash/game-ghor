"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { TYPE_LABEL, type DeviceType } from "@/lib/data";
import { api, getErrorMessage } from "@/lib/api-client";
import type { MemberView } from "@/lib/types";
import { RiArrowLeftLine } from "react-icons/ri";
import { addGuestBooking } from "@/lib/guest-bookings";

type Slot = { startTime: string; label: string; available: boolean };
type Member = MemberView | null;

function BookPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = (
    searchParams.get("type") ?? "PC"
  ).toUpperCase() as DeviceType;

  const [deviceType, setDeviceType] = useState<DeviceType>(initialType);
  const [duration, setDuration] = useState(1);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [pricePerHour, setPricePerHour] = useState(0);
  const [member, setMember] = useState<Member>(null);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get<{ member: MemberView | null }>("/auth/me")
      .then((res) => setMember(res.data.member));
  }, []);

  useEffect(() => {
    api
      .get<{
        pricePerHour: number;
        deviceCount: number;
        slots: Slot[];
      }>("/devices/slots", {
        params: {
          type: deviceType,
        },
      })
      .then((res) => {
        setSlots(res.data.slots);
        setPricePerHour(res.data.pricePerHour);
      })
      .catch((err) => {
        setError(getErrorMessage(err));
      });
  }, [deviceType]);

  function handleSelectType(t: DeviceType) {
    setDeviceType(t);
    setSelectedSlot(null);
    setError(null);
  }

  const isApprovedMember = member?.membershipStatus === "APPROVED";
  const discount = isApprovedMember ? member!.tierInfo.discount : 0;
  const basePrice = pricePerHour * duration;
  const finalPrice = Math.round(basePrice * (1 - discount));

  async function handleLock() {
    if (!selectedSlot) return;

    if (!member && !/^01[0-9]{9}$/.test(phone)) {
      setError("Enter a valid 11-digit phone number");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.post<{ booking: { id: string } }>("/bookings", {
        deviceType,
        startTime: selectedSlot,
        durationHrs: duration,
        guestPhone: member ? undefined : phone,
      });

      if (!member) {
        addGuestBooking(res.data.booking.id);
      }
      router.push(`/token/${res.data.booking.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <div className="pb-6 md:max-w-2xl md:mx-auto">
      <div className="flex items-center gap-2.5 px-[18px] md:px-0 pt-4 pb-1.5">
        <Link
          href="/"
          className="w-[34px] h-[34px] rounded-[10px] bg-card border border-line flex items-center justify-center"
        >
          <RiArrowLeftLine size={18} />
        </Link>
        <div>
          <div className="font-display text-lg font-bold">
            {TYPE_LABEL[deviceType]}
          </div>
          <div className="text-xs text-text-dim">
            {member
              ? isApprovedMember
                ? `Booking as ${member.tierInfo.label}`
                : "Booking as member · pending approval, no discount yet"
              : phone
                ? `Booking as guest · ${phone}`
                : "Booking as guest"}
          </div>
        </div>
      </div>

      {/* device type switch */}
      <div className="flex gap-2 px-[18px] md:px-0 pt-2">
        {(["PC", "PS4", "PS5"] as const).map((t) => (
          <button
            key={t}
            onClick={() => handleSelectType(t)}
            className={`flex-1 py-2 rounded-xl text-[13px] font-semibold border ${
              deviceType === t
                ? "border-pink bg-[var(--pink-dim)] text-pink"
                : "border-line bg-card text-text-dim"
            }`}
          >
            {TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      {!member && (
        <div className="px-[18px] md:px-0 pt-4">
          <label className="text-xs font-semibold text-text-dim mb-1.5 block">
            Phone number
          </label>
          <input
            type="tel"
            placeholder="01XXXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl border border-line bg-bg-soft text-text text-[15px] focus:outline-none focus:border-pink"
          />
          <div className="text-center text-[13px] text-text-dim mt-3">
            Want discounts + points?{" "}
            <Link href="/login" className="text-pink font-bold">
              Login as member
            </Link>
          </div>
        </div>
      )}

      <div className="flex gap-2 px-[18px] md:px-0 pt-4">
        {[1, 2, 3].map((h) => (
          <button
            key={h}
            onClick={() => setDuration(h)}
            className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold border ${
              duration === h
                ? "border-pink bg-[var(--pink-dim)] text-pink"
                : "border-line bg-card text-text-dim"
            }`}
          >
            {h} hr{h > 1 ? "s" : ""}
          </button>
        ))}
      </div>

      <div className="px-[18px] md:px-0 pt-5 pb-2 text-[12px] tracking-wider text-text-dim uppercase font-semibold">
        Today · slots
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5 px-[18px] md:px-0">
        {slots.map((slot) => {
          const isSelected = selectedSlot === slot.startTime;
          return (
            <button
              key={slot.startTime}
              disabled={!slot.available}
              onClick={() => setSelectedSlot(slot.startTime)}
              className={`py-3 px-1 text-center rounded-xl text-[13px] font-semibold border relative ${
                !slot.available
                  ? "border-dashed border-taken text-taken line-through cursor-not-allowed"
                  : isSelected
                    ? "border-lime bg-[var(--lime-dim)] text-lime"
                    : "border-line bg-card text-text"
              }`}
            >
              {slot.label}
              {!slot.available && (
                <span className="absolute bottom-0.5 right-1 text-[8px] tracking-wide">
                  taken
                </span>
              )}
            </button>
          );
        })}
      </div>

      {member && discount > 0 && (
        <div className="mx-[18px] md:mx-0 mt-3 px-3.5 py-2.5 rounded-[10px] bg-[var(--gold-dim)] text-gold text-[12.5px] font-semibold flex justify-between">
          <span>{member.tierInfo.label} discount</span>
          <span>-{Math.round(discount * 100)}%</span>
        </div>
      )}

      {pricePerHour > 0 && (
        <div className="mx-[18px] md:mx-0 mt-3 text-[13px] text-text-dim flex justify-between">
          <span>Estimated price</span>
          <span className="text-text font-semibold">
            {discount > 0
              ? `৳${finalPrice} (was ৳${basePrice})`
              : `৳${basePrice}`}
          </span>
        </div>
      )}

      {error && (
        <div className="mx-[18px] md:mx-0 mt-3 px-3.5 py-2.5 rounded-[10px] bg-[#ff2e9322] text-pink text-[12.5px] font-semibold">
          {error}
        </div>
      )}

      <div className="mx-[18px] md:mx-0 mt-5">
        <button
          disabled={!selectedSlot || submitting}
          onClick={handleLock}
          className="w-full py-4 rounded-2xl font-display font-bold text-[15px] tracking-wide text-white disabled:bg-card disabled:text-text-dim"
          style={
            selectedSlot && !submitting
              ? {
                  background:
                    "linear-gradient(90deg, var(--pink), var(--purple))",
                }
              : undefined
          }
        >
          {submitting
            ? "Locking in…"
            : selectedSlot
              ? `Lock in this slot · ${duration} hr${duration > 1 ? "s" : ""}`
              : "Pick a slot first"}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-text-dim text-sm">Loading…</div>}
    >
      <BookPageInner />
    </Suspense>
  );
}
