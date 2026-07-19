"use client";
import AdminTournamentsPanel from "./AdminTournamentsPanel";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isAdminLoggedIn,
  adminLogout,
  getAdminDevices,
  setDeviceStatus,
  getAllBookings,
  updateBookingStatus,
  getAdminStats,
  createWalkInBooking,
  markBookingPaid,
  getDeviceTypePrice,
  getAllMembers,
  getMemberDetail,
  approveMembership,
} from "@/lib/store";
import type { BookingStatus, DeviceStatus, DeviceType } from "@/lib/data";

type Devices = ReturnType<typeof getAdminDevices>;
type Bookings = ReturnType<typeof getAllBookings>;
type Stats = ReturnType<typeof getAdminStats>;
type Members = ReturnType<typeof getAllMembers>;
type MemberDetail = NonNullable<ReturnType<typeof getMemberDetail>>;

const BOOKING_STATUSES: BookingStatus[] = [
  "WAITING",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
];
const DEVICE_TYPES: DeviceType[] = ["PC", "PS4", "PS5"];
const FIFTEEN_MIN_MS = 15 * 60 * 1000;

function formatCountdown(ms: number) {
  if (ms <= 0) return "Time's up";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [tab, setTab] = useState<"overview" | "members" | "tournaments">(
    "overview",
  );

  const [devices, setDevices] = useState<Devices>([]);
  const [bookings, setBookings] = useState<Bookings>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [members, setMembers] = useState<Members>([]);
  const [now, setNow] = useState(() => Date.now());

  // walk-in form state
  const [walkInType, setWalkInType] = useState<DeviceType>("PC");
  const [walkInDuration, setWalkInDuration] = useState(1);
  const [walkInPhone, setWalkInPhone] = useState("");
  const [walkInError, setWalkInError] = useState<string | null>(null);
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);

  //tournaments tab

  // members tab state
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberDetail, setMemberDetail] = useState<MemberDetail | null>(null);

  function refresh() {
    setDevices(getAdminDevices());
    setBookings(getAllBookings());
    setStats(getAdminStats());
    setMembers(getAllMembers());
    if (selectedMemberId) setMemberDetail(getMemberDetail(selectedMemberId));
  }

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      router.replace("/admin/login");
      return;
    }
    queueMicrotask(() => {
      setChecked(true);
      refresh();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Ticks every second so ACTIVE sessions' countdowns stay live, and
  // auto-completes any session whose timer has run out.
  useEffect(() => {
    const interval = setInterval(() => {
      const current = getAllBookings();
      const expired = current.filter(
        (b) =>
          b.status === "ACTIVE" && new Date(b.endTime).getTime() <= Date.now(),
      );
      if (expired.length > 0) {
        expired.forEach((b) => updateBookingStatus(b.id, "COMPLETED"));
        refresh();
      } else {
        setNow(Date.now());
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    adminLogout();
    router.push("/admin/login");
  }

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

  function openMember(id: string) {
    setSelectedMemberId(id);
    setMemberDetail(getMemberDetail(id));
  }

  function closeMember() {
    setSelectedMemberId(null);
    setMemberDetail(null);
  }

  function handleApprove(id: string) {
    approveMembership(id);
    refresh();
  }

  if (!checked || !stats) {
    return <div className="p-6 text-text-dim text-sm">Loading…</div>;
  }

  const walkInPrice = getDeviceTypePrice(walkInType) * walkInDuration;
  const filteredMembers = members.filter((m) =>
    m.phone.includes(memberSearch.trim()),
  );

  return (
    <div className="pb-10 px-[18px] md:px-0">
      <div className="flex items-center justify-between pt-6 pb-4">
        <div>
          <div className="font-display text-xl font-bold">Admin dashboard</div>
          <div className="text-xs text-text-dim mt-0.5">
            Devices, bookings, and today&apos;s numbers.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-xs font-semibold text-text-dim bg-card border border-line px-3 py-1.5 rounded-full"
          >
            ← Site
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold text-text-dim bg-card border border-line px-3 py-1.5 rounded-full"
          >
            Log out
          </button>
        </div>
      </div>

      {/* tabs */}
      <div className="flex gap-2 pb-5">
        <button
          onClick={() => setTab("overview")}
          className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold border ${
            tab === "overview"
              ? "border-pink bg-[var(--pink-dim)] text-pink"
              : "border-line bg-card text-text-dim"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setTab("members")}
          className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold border ${
            tab === "members"
              ? "border-pink bg-[var(--pink-dim)] text-pink"
              : "border-line bg-card text-text-dim"
          }`}
        >
          Members
        </button>
        <button
          onClick={() => setTab("tournaments")}
          className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold border ${
            tab === "tournaments"
              ? "border-pink bg-[var(--pink-dim)] text-pink"
              : "border-line bg-card text-text-dim"
          }`}
        >
          Tournaments
        </button>
      </div>

      {tab === "overview" ? (
        <>
          {/* stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <StatCard
              label="Devices free"
              value={`${stats.devicesFree}/${stats.devicesTotal}`}
            />
            <StatCard
              label="Bookings today"
              value={String(stats.bookingsToday)}
            />
            <StatCard
              label="Revenue today"
              value={`৳${stats.revenueToday}`}
              accent="text-gold"
            />
            <StatCard
              label="Total members"
              value={String(stats.totalMembers)}
            />
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
                        ? "border-pink bg-[var(--pink-dim)] text-pink"
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
                        ? "border-pink bg-[var(--pink-dim)] text-pink"
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
                  background:
                    "linear-gradient(90deg, var(--pink), var(--purple))",
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
            <div className="overflow-x-auto -mx-[18px] md:mx-0 px-[18px] md:px-0">
              <table className="w-full text-[13px] border-collapse min-w-[760px]">
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
                    const end = new Date(b.endTime).toLocaleTimeString(
                      "en-US",
                      { hour: "numeric", minute: "2-digit" },
                    );
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
                              className="text-[11px] font-semibold text-gold bg-[var(--gold-dim)] border border-gold px-2.5 py-1 rounded-full whitespace-nowrap"
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
            Member points and hours are only credited once a booking is marked
            paid.
          </p>
        </>
      ) : (
        <>
          {/* members tab */}
          <input
            type="tel"
            placeholder="Search by phone number…"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            className="w-full md:max-w-xs px-3.5 py-2.5 rounded-xl border border-line bg-bg-soft text-text text-[13.5px] focus:outline-none focus:border-pink mb-4"
          />

          {filteredMembers.length === 0 ? (
            <div className="text-center py-12 text-text-dim text-[13.5px]">
              No members found.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-[18px] md:mx-0 px-[18px] md:px-0">
              <table className="w-full text-[13px] border-collapse min-w-[520px]">
                <thead>
                  <tr className="text-left text-text-dim text-[11px] uppercase tracking-wider">
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Phone</th>
                    <th className="py-2 pr-3">Member ID</th>
                    <th className="py-2 pr-3">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m) => (
                    <tr
                      key={m.id}
                      onClick={() => openMember(m.id)}
                      className="border-t border-line cursor-pointer hover:bg-bg-soft"
                    >
                      <td className="py-2.5 pr-3 font-semibold">
                        {m.name}
                        {m.membershipStatus === "PENDING" && (
                          <span className="ml-2 text-[10px] font-bold text-gold bg-[var(--gold-dim)] border border-gold px-1.5 py-0.5 rounded-full align-middle">
                            PENDING
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-text-dim">{m.phone}</td>
                      <td className="py-2.5 pr-3 text-text-dim">{m.id}</td>
                      <td className="py-2.5 pr-3 font-bold text-gold">
                        {m.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* member detail modal */}
      {selectedMemberId && memberDetail && (
        <div
          className="fixed inset-0 z-20 bg-black/60 flex items-center justify-center p-4"
          onClick={closeMember}
        >
          <div
            className="bg-card border border-line rounded-2xl w-full max-w-md p-5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="font-display text-lg font-bold">
                  {memberDetail.member.name}
                </div>
                <div className="text-xs text-text-dim mt-0.5">
                  {memberDetail.member.phone}
                </div>
              </div>
              <button
                onClick={closeMember}
                className="text-text-dim text-xl leading-none"
              >
                ×
              </button>
            </div>

            {memberDetail.member.membershipStatus === "PENDING" ? (
              <div className="flex items-center justify-between bg-[var(--gold-dim)] border border-gold rounded-xl px-3.5 py-3 mb-4">
                <span className="text-[12.5px] font-bold text-gold">
                  ⏳ Pending approval
                </span>
                <button
                  onClick={() => handleApprove(memberDetail.member.id)}
                  className="text-[11.5px] font-bold text-white px-3 py-1.5 rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, var(--pink), var(--purple))",
                  }}
                >
                  Approve membership
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-[var(--lime-dim)] border border-lime rounded-xl px-3.5 py-2.5 mb-4 text-[12.5px] font-bold text-lime">
                ✓ Approved member
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <DetailStat
                label="Member ID"
                value={memberDetail.member.id}
                small
              />
              <DetailStat
                label="Member since"
                value={formatDate(memberDetail.member.createdAt)}
              />
              <DetailStat
                label="Points"
                value={String(memberDetail.member.points)}
                accent="text-gold"
              />
              <DetailStat
                label="Total hours"
                value={`${memberDetail.member.totalHours}h`}
              />
              <DetailStat
                label="Total visits"
                value={String(memberDetail.visitCount)}
              />
              <DetailStat
                label="Visits (last 30d)"
                value={String(memberDetail.visitsLast30Days)}
              />
            </div>

            <div className="text-[11px] text-text-dim mb-1">
              Last visit:{" "}
              {memberDetail.lastVisit
                ? formatDate(memberDetail.lastVisit)
                : "No visits yet"}
            </div>

            <div className="text-[12px] tracking-wider text-text-dim uppercase font-semibold pt-3 pb-2">
              Booking history
            </div>
            {memberDetail.bookings.length === 0 ? (
              <div className="text-[12.5px] text-text-dim py-3">
                No bookings yet.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {memberDetail.bookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex justify-between items-center bg-bg-soft rounded-xl px-3 py-2 text-[12.5px]"
                  >
                    <div>
                      <div className="font-semibold">
                        {b.device?.name ?? "Device"} · #{b.token}
                      </div>
                      <div className="text-text-dim text-[11px] mt-0.5">
                        {formatDate(b.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">৳{b.finalPrice}</div>
                      <div className="text-[10.5px] text-text-dim mt-0.5">
                        {b.status}
                        {b.paid ? " · paid" : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="p-3.5 rounded-2xl bg-card border border-line">
      <div
        className={`font-display text-xl font-bold ${accent ?? "text-text"}`}
      >
        {value}
      </div>
      <div className="text-[11px] text-text-dim mt-0.5">{label}</div>
    </div>
  );
}

function DetailStat({
  label,
  value,
  accent,
  small,
}: {
  label: string;
  value: string;
  accent?: string;
  small?: boolean;
}) {
  return (
    <div className="p-3 rounded-xl bg-bg-soft border border-line">
      <div
        className={`font-bold ${small ? "text-[11px] break-all" : "text-[15px]"} ${accent ?? "text-text"}`}
      >
        {value}
      </div>
      <div className="text-[10.5px] text-text-dim mt-0.5">{label}</div>
    </div>
  );
}
