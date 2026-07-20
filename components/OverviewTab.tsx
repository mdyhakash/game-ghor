import { useState } from "react";
import {
  setDeviceStatus,
  updateBookingStatus,
  markBookingPaid,
  createWalkInBooking,
  getDeviceTypePrice,
} from "@/lib/store";
import type { BookingStatus, DeviceStatus, DeviceType } from "@/lib/data";
import type { Devices, Bookings, Stats } from "@/hooks/useAdminData";
import StatCard from "./StatCard";
import { formatCountdown } from "@/lib/format";

const BOOKING_STATUSES: BookingStatus[] = [
  "WAITING",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
];
const DEVICE_TYPES: DeviceType[] = ["PC", "PS4", "PS5"];
const FIFTEEN_MIN_MS = 15 * 60 * 1000;

interface OverviewTabProps {
  devices: Devices;
  bookings: Bookings;
  stats: Stats;
  now: number;
  refresh: () => void;
}

export default function OverviewTab({
  devices,
  bookings,
  stats,
  now,
  refresh,
}: OverviewTabProps) {
  // walk-in form state
  const [walkInType, setWalkInType] = useState<DeviceType>("PC");
  const [walkInDuration, setWalkInDuration] = useState(1);
  const [walkInPhone, setWalkInPhone] = useState("");
  const [walkInError, setWalkInError] = useState<string | null>(null);
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);

  function handleToggleStatus(deviceId: string, current: DeviceStatus) {
    setDeviceStatus(
      deviceId,
      current === "AVAILABLE" ? "MAINTENANCE" : "AVAILABLE",
    );
    refresh();
  }

  function handleBookingStatus(id: string, status: BookingStatus) {
    updateBookingStatus(id, status);
    refresh();
  }

  function handleMarkPaid(id: string) {
    markBookingPaid(id);
    refresh();
  }

  function handleWalkInSubmit(e: React.FormEvent) {
    e.preventDefault();
    setWalkInSubmitting(true);
    setWalkInError(null);
    const result = createWalkInBooking({
      deviceType: walkInType,
      durationHrs: walkInDuration,
      guestPhone: walkInPhone,
    });
    setWalkInSubmitting(false);
    if ("error" in result) {
      setWalkInError(result.error);
      return;
    }
    setWalkInPhone("");
    refresh();
  }

  const walkInPrice = getDeviceTypePrice(walkInType) * walkInDuration;

  return (
    <>
      {/* stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <StatCard
          label="Devices free"
          value={`${stats.devicesFree}/${stats.devicesTotal}`}
        />
        <StatCard label="Bookings today" value={String(stats.bookingsToday)} />
        <StatCard
          label="Revenue today"
          value={`৳${stats.revenueToday}`}
          accent="text-gold"
        />
        <StatCard label="Total members" value={String(stats.totalMembers)} />
      </div>

      {/* walk-in booking */}
      <div className="pt-7 pb-2 text-[12px] tracking-wider text-text-dim uppercase font-semibold">
        New walk-in booking
      </div>
      <form
        onSubmit={handleWalkInSubmit}
        className="bg-card border border-line rounded-2xl p-4 flex flex-col md:flex-row md:items-end gap-3"
      >
        <div className="flex-1">
          <label className="text-[11px] font-semibold text-text-dim mb-1.5 block">
            Device
          </label>
          <div className="flex gap-1.5">
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

      {/* devices */}
      <div className="pt-7 pb-2 text-[12px] tracking-wider text-text-dim uppercase font-semibold">
        Devices
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {devices.map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between bg-card border border-line rounded-2xl px-4 py-3"
          >
            <div>
              <div className="font-bold text-sm">{d.name}</div>
              <div className="text-xs text-text-dim mt-0.5">
                {d.type} · ৳{d.pricePerHour}/hr
              </div>
              <div
                className={`text-[10.5px] font-bold mt-1 ${
                  d.status === "MAINTENANCE"
                    ? "text-taken"
                    : d.isFreeNow
                      ? "text-lime"
                      : "text-gold"
                }`}
              >
                {d.status === "MAINTENANCE"
                  ? "MAINTENANCE"
                  : d.isFreeNow
                    ? "FREE"
                    : "IN USE"}
              </div>
            </div>
            <button
              onClick={() => handleToggleStatus(d.id, d.status)}
              className="text-[11px] font-semibold text-text-dim bg-bg-soft border border-line px-2.5 py-1.5 rounded-full whitespace-nowrap"
            >
              {d.status === "MAINTENANCE"
                ? "Set available"
                : "Set maintenance"}
            </button>
          </div>
        ))}
      </div>

      {/* bookings */}
      <div className="pt-7 pb-2 text-[12px] tracking-wider text-text-dim uppercase font-semibold">
        All bookings
      </div>
      {bookings.length === 0 ? (
        <div className="text-center py-12 text-text-dim text-[13.5px]">
          No bookings yet.
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4.5 md:mx-0 px-4.5 md:px-0">
          <table className="w-full text-[13px] border-collapse min-w-190">
            <thead>
              <tr className="text-left text-text-dim text-[11px] uppercase tracking-wider">
                <th className="py-2 pr-3">Token</th>
                <th className="py-2 pr-3">Customer</th>
                <th className="py-2 pr-3">Device</th>
                <th className="py-2 pr-3">Time</th>
                <th className="py-2 pr-3">Timer</th>
                <th className="py-2 pr-3">Price</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Payment</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const start = new Date(b.startTime).toLocaleTimeString(
                  "en-US",
                  { hour: "numeric", minute: "2-digit" },
                );
                const end = new Date(b.endTime).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                });
                const remainingMs = new Date(b.endTime).getTime() - now;
                // Green while there's plenty of time left, red once the session
                // has 15 minutes or less remaining (or has already run out).
                const timerColor =
                  remainingMs <= FIFTEEN_MIN_MS ? "text-pink" : "text-lime";
                return (
                  <tr key={b.id} className="border-t border-line">
                    <td className="py-2.5 pr-3 font-display font-bold text-lime">
                      #{b.token}
                    </td>
                    <td className="py-2.5 pr-3">{b.customerLabel}</td>
                    <td className="py-2.5 pr-3">{b.device?.name ?? "—"}</td>
                    <td className="py-2.5 pr-3 text-text-dim">
                      {start} – {end}
                    </td>
                    <td className="py-2.5 pr-3">
                      {b.status === "ACTIVE" ? (
                        <span
                          className={`font-display font-bold ${timerColor}`}
                        >
                          {formatCountdown(remainingMs)}
                        </span>
                      ) : (
                        <span className="text-text-dim">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3">৳{b.finalPrice}</td>
                    <td className="py-2.5 pr-3">
                      <select
                        value={b.status}
                        onChange={(e) =>
                          handleBookingStatus(
                            b.id,
                            e.target.value as BookingStatus,
                          )
                        }
                        className="bg-bg-soft border border-line rounded-lg px-2 py-1 text-[12px] text-text"
                      >
                        {BOOKING_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 pr-3">
                      {b.paid ? (
                        <span className="text-[11px] font-bold text-lime">
                          PAID
                        </span>
                      ) : (
                        <button
                          onClick={() => handleMarkPaid(b.id)}
                          className="text-[11px] font-semibold text-gold bg-(--gold-dim) border border-gold px-2.5 py-1 rounded-full whitespace-nowrap"
                        >
                          Mark paid
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] text-text-dim mt-2">
        Member points and hours are only credited once a booking is marked paid.
      </p>
    </>
  );
}
