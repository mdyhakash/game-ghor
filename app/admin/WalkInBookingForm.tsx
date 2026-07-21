import { useState } from "react";
import { api, getErrorMessage } from "@/lib/api-client";
import type { DeviceType } from "@/lib/data";
import type { Devices } from "@/hooks/useAdminData";

import { DEVICE_META } from "@/lib/data";

const DEVICE_TYPES = Object.keys(DEVICE_META) as DeviceType[];

interface WalkInBookingFormProps {
  devices: Devices;
  onBooked: () => void;
}

export default function WalkInBookingForm({
  devices,
  onBooked,
}: WalkInBookingFormProps) {
  const [walkInType, setWalkInType] = useState<DeviceType>("PC");
  const [walkInDuration, setWalkInDuration] = useState(1);
  const [walkInPhone, setWalkInPhone] = useState("");
  const [walkInError, setWalkInError] = useState<string | null>(null);
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);

  async function handleWalkInSubmit(e: React.FormEvent) {
    e.preventDefault();
    setWalkInSubmitting(true);
    setWalkInError(null);
    try {
      await api.post("/admin/bookings", {
        deviceType: walkInType,
        durationHrs: walkInDuration,
        guestPhone: walkInPhone,
      });
      setWalkInPhone("");
      onBooked();
    } catch (err) {
      setWalkInError(getErrorMessage(err));
    } finally {
      setWalkInSubmitting(false);
    }
  }

  const walkInDevice = devices.find((d) => d.type === walkInType);
  const walkInPrice = (walkInDevice?.pricePerHour ?? 0) * walkInDuration;

  return (
    <div>
      <div className="pb-2 text-[12px] tracking-wider text-text-dim uppercase font-semibold">
        New walk-in booking
      </div>
      <form
        onSubmit={handleWalkInSubmit}
        className="bg-card border border-line rounded-2xl p-4 grid grid-cols-1  gap-4"
      >
        <div className="flex-1">
          <label className="text-[11px] font-semibold text-text-dim mb-1.5 block">
            Device
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DEVICE_TYPES.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setWalkInType(t)}
                className={`flex-1 py-2 rounded-lg text-[12.5px] font-semibold border ${
                  walkInType === t
                    ? "border-pink bg-(--pink-dim) text-pink"
                    : "border-line bg-bg-soft text-text-dim"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <label className="text-[11px] font-semibold text-text-dim mb-1.5 block">
            Duration
          </label>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((h) => (
              <button
                type="button"
                key={h}
                onClick={() => setWalkInDuration(h)}
                className={`flex-1 py-2 rounded-lg text-[12.5px] font-semibold border ${
                  walkInDuration === h
                    ? "border-pink bg-(--pink-dim) text-pink"
                    : "border-line bg-bg-soft text-text-dim"
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <label className="text-[11px] font-semibold text-text-dim mb-1.5 block">
            Phone (optional)
          </label>
          <input
            type="tel"
            placeholder="01XXXXXXXXX"
            value={walkInPhone}
            onChange={(e) => setWalkInPhone(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px] focus:outline-none focus:border-pink"
          />
        </div>
        <div className="flex flex-col items-stretch">
          <div className="text-[11px] text-text-dim mb-1.5 md:text-center">
            ৳{walkInPrice}
          </div>
          <button
            type="submit"
            disabled={walkInSubmitting}
            className="px-4 py-2.5 rounded-lg font-display font-bold text-[13px] tracking-wide text-white whitespace-nowrap"
            style={{
              background: "linear-gradient(90deg, var(--pink), var(--purple))",
            }}
          >
            {walkInSubmitting ? "Starting…" : "Start session"}
          </button>
        </div>
      </form>
      {walkInError && (
        <div className="mt-2 px-3.5 py-2.5 rounded-[10px] bg-[#ff2e9322] text-pink text-[12.5px] font-semibold">
          {walkInError}
        </div>
      )}
    </div>
  );
}
