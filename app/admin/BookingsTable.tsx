import { useState } from "react";
import { api } from "@/lib/api-client";
import type { BookingStatus } from "@/lib/data";
import type { Bookings, Devices } from "@/hooks/useAdminData";
import { formatCountdown } from "@/lib/format";

const BOOKING_STATUSES: BookingStatus[] = [
  "WAITING",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
];
const FIFTEEN_MIN_MS = 15 * 60 * 1000;

interface BookingsTableProps {
  bookings: Bookings;
  devices: Devices;
  now: number;
  refresh: () => void;
}

export default function BookingsTable({
  bookings,
  devices,
  now,
  refresh,
}: BookingsTableProps) {
  const [bookingSearch, setBookingSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "ALL">(
    "ALL",
  );
  const [deviceFilter, setDeviceFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState("");

  async function handleBookingStatus(id: string, status: BookingStatus) {
    await api.patch(`/admin/bookings/${id}/status`, { status });
    refresh();
  }

  async function handleMarkPaid(id: string) {
    await api.post(`/admin/bookings/${id}/paid`);
    refresh();
  }

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
    if (deviceFilter !== "ALL" && b.deviceId !== deviceFilter) return false;
    if (dateFilter) {
      const bookingDate = new Date(b.startTime).toISOString().slice(0, 10);
      if (bookingDate !== dateFilter) return false;
    }
    const q = bookingSearch.trim().toLowerCase();
    if (q) {
      const matchesToken = b.token.toLowerCase().includes(q);
      const matchesCustomer = b.customerLabel.toLowerCase().includes(q);
      if (!matchesToken && !matchesCustomer) return false;
    }
    return true;
  });

  return (
    <>
      <div className="flex flex-col md:flex-row gap-2 mb-3">
        <input
          value={bookingSearch}
          onChange={(e) => setBookingSearch(e.target.value)}
          placeholder="Search token or customer…"
          className="flex-1 px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px] focus:outline-none focus:border-pink"
        />
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as BookingStatus | "ALL")
          }
          className="px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px]"
        >
          <option value="ALL">All statuses</option>
          {BOOKING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={deviceFilter}
          onChange={(e) => setDeviceFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px]"
        >
          <option value="ALL">All devices</option>
          {devices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px]"
        />
        {(bookingSearch ||
          statusFilter !== "ALL" ||
          deviceFilter !== "ALL" ||
          dateFilter) && (
          <button
            onClick={() => {
              setBookingSearch("");
              setStatusFilter("ALL");
              setDeviceFilter("ALL");
              setDateFilter("");
            }}
            className="px-3 py-2 rounded-lg text-[12px] font-semibold text-text-dim bg-bg-soft border border-line whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
      </div>

      {filteredBookings.length === 0 ? (
        <div className="text-center py-12 text-text-dim text-[13.5px]">
          {bookings.length === 0
            ? "No bookings yet."
            : "No bookings match these filters."}
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
              {filteredBookings.map((b) => {
                const start = new Date(b.startTime).toLocaleTimeString(
                  "en-US",
                  { hour: "numeric", minute: "2-digit" },
                );
                const end = new Date(b.endTime).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                });
                const remainingMs = new Date(b.endTime).getTime() - now;
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
                      ) : b.status === "COMPLETED" ? (
                        <button
                          onClick={() => handleMarkPaid(b.id)}
                          className="text-[11px] font-semibold text-gold bg-(--gold-dim) border border-gold px-2.5 py-1 rounded-full whitespace-nowrap"
                        >
                          Mark paid
                        </button>
                      ) : (
                        <span className="text-[11px] text-text-dim">—</span>
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
