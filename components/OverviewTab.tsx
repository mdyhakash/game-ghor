import { useState } from "react";
import { api, getErrorMessage } from "@/lib/api-client";
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
  // walk-in form
  const [walkInType, setWalkInType] = useState<DeviceType>("PC");
  const [walkInDuration, setWalkInDuration] = useState(1);
  const [walkInPhone, setWalkInPhone] = useState("");
  const [walkInError, setWalkInError] = useState<string | null>(null);
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);

  // add device form
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceType, setNewDeviceType] = useState<DeviceType>("PC");
  const [newDevicePrice, setNewDevicePrice] = useState(0);
  const [newDeviceError, setNewDeviceError] = useState<string | null>(null);
  const [newDeviceSubmitting, setNewDeviceSubmitting] = useState(false);

  // device edit
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [editDeviceName, setEditDeviceName] = useState("");
  const [editDeviceType, setEditDeviceType] = useState<DeviceType>("PC");
  const [editDevicePrice, setEditDevicePrice] = useState(0);
  const [editDeviceError, setEditDeviceError] = useState<string | null>(null);
  const [editDeviceSaving, setEditDeviceSaving] = useState(false);

  // booking filters
  const [bookingSearch, setBookingSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "ALL">(
    "ALL",
  );
  const [deviceFilter, setDeviceFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState("");

  async function handleToggleStatus(deviceId: string, current: DeviceStatus) {
    await api.patch(`/admin/devices/${deviceId}/status`, {
      status: current === "AVAILABLE" ? "MAINTENANCE" : "AVAILABLE",
    });
    refresh();
  }

  async function handleAddDevice(e: React.FormEvent) {
    e.preventDefault();
    setNewDeviceSubmitting(true);
    setNewDeviceError(null);
    try {
      await api.post("/admin/devices", {
        name: newDeviceName,
        type: newDeviceType,
        pricePerHour: newDevicePrice,
      });
      setNewDeviceName("");
      setNewDevicePrice(0);
      refresh();
    } catch (err) {
      setNewDeviceError(getErrorMessage(err));
    } finally {
      setNewDeviceSubmitting(false);
    }
  }

  function startEditDevice(
    deviceId: string,
    name: string,
    type: DeviceType,
    price: number,
  ) {
    setEditingDeviceId(deviceId);
    setEditDeviceName(name);
    setEditDeviceType(type);
    setEditDevicePrice(price);
    setEditDeviceError(null);
  }

  async function handleSaveDevice(deviceId: string) {
    setEditDeviceSaving(true);
    setEditDeviceError(null);
    try {
      await api.patch(`/admin/devices/${deviceId}`, {
        name: editDeviceName,
        type: editDeviceType,
        pricePerHour: editDevicePrice,
      });
      setEditingDeviceId(null);
      refresh();
    } catch (err) {
      setEditDeviceError(getErrorMessage(err));
    } finally {
      setEditDeviceSaving(false);
    }
  }

  async function handleDeleteDevice(deviceId: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
    try {
      await api.delete(`/admin/devices/${deviceId}`);
      refresh();
    } catch (err) {
      window.alert(getErrorMessage(err));
    }
  }

  async function handleBookingStatus(id: string, status: BookingStatus) {
    await api.patch(`/admin/bookings/${id}/status`, { status });
    refresh();
  }

  async function handleMarkPaid(id: string) {
    await api.post(`/admin/bookings/${id}/paid`);
    refresh();
  }

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
      refresh();
    } catch (err) {
      setWalkInError(getErrorMessage(err));
    } finally {
      setWalkInSubmitting(false);
    }
  }

  const walkInDevice = devices.find((d) => d.type === walkInType);
  const walkInPrice = (walkInDevice?.pricePerHour ?? 0) * walkInDuration;

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
      <form
        onSubmit={handleAddDevice}
        className="bg-card border border-line rounded-2xl p-4 flex flex-col md:flex-row md:items-end gap-3 mb-3"
      >
        <div className="flex-1">
          <label className="text-[11px] font-semibold text-text-dim mb-1.5 block">
            Device name
          </label>
          <input
            value={newDeviceName}
            onChange={(e) => setNewDeviceName(e.target.value)}
            placeholder="e.g. PC-05"
            className="w-full px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px] focus:outline-none focus:border-pink"
          />
        </div>
        <div className="flex-1">
          <label className="text-[11px] font-semibold text-text-dim mb-1.5 block">
            Type
          </label>
          <div className="flex gap-1.5">
            {DEVICE_TYPES.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setNewDeviceType(t)}
                className={`flex-1 py-2 rounded-lg text-[12.5px] font-semibold border ${
                  newDeviceType === t
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
            Price/hr (৳)
          </label>
          <input
            type="number"
            min={0}
            value={newDevicePrice}
            onChange={(e) => setNewDevicePrice(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px] focus:outline-none focus:border-pink"
          />
        </div>
        <button
          type="submit"
          disabled={newDeviceSubmitting}
          className="px-4 py-2.5 rounded-lg font-display font-bold text-[13px] tracking-wide text-white whitespace-nowrap"
          style={{
            background: "linear-gradient(90deg, var(--pink), var(--purple))",
          }}
        >
          {newDeviceSubmitting ? "Adding…" : "Add device"}
        </button>
      </form>
      {newDeviceError && (
        <div className="mb-3 px-3.5 py-2.5 rounded-[10px] bg-[#ff2e9322] text-pink text-[12.5px] font-semibold">
          {newDeviceError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {devices.map((d) =>
          editingDeviceId === d.id ? (
            <div
              key={d.id}
              className="bg-card border border-pink rounded-2xl px-4 py-3 flex flex-col gap-2"
            >
              <input
                value={editDeviceName}
                onChange={(e) => setEditDeviceName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-line bg-bg-soft text-text text-[12.5px] focus:outline-none focus:border-pink"
              />
              <div className="flex gap-1.5">
                {DEVICE_TYPES.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setEditDeviceType(t)}
                    className={`flex-1 py-1.5 rounded-lg text-[11.5px] font-semibold border ${
                      editDeviceType === t
                        ? "border-pink bg-(--pink-dim) text-pink"
                        : "border-line bg-bg-soft text-text-dim"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={0}
                value={editDevicePrice}
                onChange={(e) => setEditDevicePrice(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-line bg-bg-soft text-text text-[12.5px] focus:outline-none focus:border-pink"
              />
              {editDeviceError && (
                <div className="text-[11px] text-pink">{editDeviceError}</div>
              )}
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleSaveDevice(d.id)}
                  disabled={editDeviceSaving}
                  className="flex-1 py-1.5 rounded-lg text-[11.5px] font-bold text-white"
                  style={{
                    background:
                      "linear-gradient(90deg, var(--pink), var(--purple))",
                  }}
                >
                  {editDeviceSaving ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={() => setEditingDeviceId(null)}
                  className="flex-1 py-1.5 rounded-lg text-[11.5px] font-semibold text-text-dim bg-bg-soft border border-line"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
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
              <div className="flex flex-col items-end gap-1.5">
                <button
                  onClick={() => handleToggleStatus(d.id, d.status)}
                  className="text-[11px] font-semibold text-text-dim bg-bg-soft border border-line px-2.5 py-1.5 rounded-full whitespace-nowrap"
                >
                  {d.status === "MAINTENANCE"
                    ? "Set available"
                    : "Set maintenance"}
                </button>
                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      startEditDevice(
                        d.id,
                        d.name,
                        d.type as DeviceType,
                        d.pricePerHour,
                      )
                    }
                    className="text-[10.5px] font-semibold text-text-dim bg-bg-soft border border-line px-2 py-1 rounded-full"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteDevice(d.id, d.name)}
                    className="text-[10.5px] font-semibold text-pink bg-[#ff2e9322] border border-pink px-2 py-1 rounded-full"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ),
        )}
      </div>

      {/* bookings */}
      <div className="pt-7 pb-2 text-[12px] tracking-wider text-text-dim uppercase font-semibold">
        All bookings
      </div>

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
