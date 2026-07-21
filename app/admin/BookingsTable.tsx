import { useMemo, useState } from "react";
import { api, getErrorMessage } from "@/lib/api-client";
import type { BookingStatus } from "@/lib/data";
import type { Bookings, Devices } from "@/hooks/useAdminData";
import { formatCountdown } from "@/lib/format";
import { useToast } from "@/components/Toast";
const BOOKING_STATUSES: BookingStatus[] = [
  "WAITING",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
];
const FIFTEEN_MIN_MS = 15 * 60 * 1000;
const PAGE_SIZE = 15;

type BookingRow = Bookings[number];

function dateKeyOf(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-CA"); // local YYYY-MM-DD
}

function dateLabel(dateKey: string, todayKey: string): string {
  if (dateKey === todayKey) return "Today";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey === dateKeyOf(yesterday)) return "Yesterday";
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

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

  const [visibleDates, setVisibleDates] = useState<string[]>(() => [
    dateKeyOf(new Date()),
  ]);
  const [pageByDate, setPageByDate] = useState<Record<string, number>>({});
  const [flatPage, setFlatPage] = useState(1);

  const todayKey = useMemo(() => dateKeyOf(new Date()), []);
  const { showToast, confirmToast } = useToast();
  async function handleBookingStatus(id: string, status: BookingStatus) {
    await api.patch(`/admin/bookings/${id}/status`, { status });
    refresh();
  }

  async function handleMarkPaid(id: string) {
    await api.post(`/admin/bookings/${id}/paid`);
    refresh();
  }
  async function handleDelete(id: string) {
    const ok = await confirmToast(
      "Delete this booking? This can't be undone.",
      {
        confirmLabel: "Delete",
      },
    );
    if (!ok) return;
    try {
      await api.delete(`/admin/bookings/${id}`);
      showToast("Booking deleted", "success");
      refresh();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  }

  const isFiltering =
    bookingSearch.trim() !== "" ||
    statusFilter !== "ALL" ||
    deviceFilter !== "ALL" ||
    dateFilter !== "";

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
    if (deviceFilter !== "ALL" && b.deviceId !== deviceFilter) return false;
    if (dateFilter) {
      if (dateKeyOf(b.startTime) !== dateFilter) return false;
    }
    const q = bookingSearch.trim().toLowerCase();
    if (q) {
      const matchesToken = b.token.toLowerCase().includes(q);
      const matchesCustomer = b.customerLabel.toLowerCase().includes(q);
      if (!matchesToken && !matchesCustomer) return false;
    }
    return true;
  });

  // Grouped by date — used for the default (no filters applied) view.
  const groups = useMemo(() => {
    const map = new Map<string, BookingRow[]>();
    for (const b of bookings) {
      const key = dateKeyOf(b.startTime);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
      );
    }
    return map;
  }, [bookings]);

  const sortedDateKeys = useMemo(
    () => Array.from(groups.keys()).sort((a, b) => (a < b ? 1 : -1)),
    [groups],
  );

  const remainingDates = sortedDateKeys.filter(
    (d) => !visibleDates.includes(d),
  );

  function showMore() {
    const next = remainingDates[0];
    if (next) setVisibleDates((prev) => [...prev, next]);
  }

  function clearFilters() {
    setBookingSearch("");
    setStatusFilter("ALL");
    setDeviceFilter("ALL");
    setDateFilter("");
    setFlatPage(1);
  }

  function renderRow(b: BookingRow) {
    const start = new Date(b.startTime).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
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
            <span className={`font-display font-bold ${timerColor}`}>
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
              handleBookingStatus(b.id, e.target.value as BookingStatus)
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
            <span className="text-[11px] font-bold text-lime">PAID</span>
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
        <td className="py-2.5 pr-3">
          <button
            onClick={() => handleDelete(b.id)}
            className="text-[11px] font-semibold text-pink bg-(--pink-dim) border border-pink px-2.5 py-1 rounded-full whitespace-nowrap"
          >
            Delete
          </button>
        </td>
      </tr>
    );
  }

  const tableHead = (
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
        <th className="py-2 pr-3">Delete</th>
      </tr>
    </thead>
  );

  function Pager({
    page,
    totalPages,
    onChange,
  }: {
    page: number;
    totalPages: number;
    onChange: (p: number) => void;
  }) {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-center gap-3 mt-3">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-line disabled:opacity-30"
        >
          Prev
        </button>
        <span className="text-[12px] text-text-dim">
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-line disabled:opacity-30"
        >
          Next
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row gap-2 mb-3">
        <input
          value={bookingSearch}
          onChange={(e) => {
            setBookingSearch(e.target.value);
            setFlatPage(1);
          }}
          placeholder="Search token or customer…"
          className="flex-1 px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px] focus:outline-none focus:border-pink"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as BookingStatus | "ALL");
            setFlatPage(1);
          }}
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
          onChange={(e) => {
            setDeviceFilter(e.target.value);
            setFlatPage(1);
          }}
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
          onChange={(e) => {
            setDateFilter(e.target.value);
            setFlatPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px]"
        />
        {isFiltering && (
          <button
            onClick={clearFilters}
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
      ) : isFiltering ? (
        // Filters are active — show a flat, standard paginated table
        // across whatever matched, regardless of date.
        (() => {
          const totalPages = Math.max(
            1,
            Math.ceil(filteredBookings.length / PAGE_SIZE),
          );
          const page = Math.min(flatPage, totalPages);
          const pageItems = filteredBookings.slice(
            (page - 1) * PAGE_SIZE,
            page * PAGE_SIZE,
          );
          return (
            <>
              <div className="overflow-x-auto -mx-4.5 md:mx-0 px-4.5 md:px-0">
                <table className="w-full text-[13px] border-collapse min-w-190">
                  {tableHead}
                  <tbody>{pageItems.map(renderRow)}</tbody>
                </table>
              </div>
              <Pager
                page={page}
                totalPages={totalPages}
                onChange={setFlatPage}
              />
            </>
          );
        })()
      ) : (
        // Default view — date-wise, today only, with "show more" for history.
        <>
          {visibleDates.map((dateKey) => {
            const dayBookings = groups.get(dateKey) ?? [];
            const page = pageByDate[dateKey] ?? 1;
            const totalPages = Math.max(
              1,
              Math.ceil(dayBookings.length / PAGE_SIZE),
            );
            const pageItems = dayBookings.slice(
              (page - 1) * PAGE_SIZE,
              page * PAGE_SIZE,
            );

            return (
              <div key={dateKey} className="mb-5">
                <div className="text-xs font-bold text-text-dim uppercase tracking-wide mb-2">
                  {dateLabel(dateKey, todayKey)}
                </div>

                {dayBookings.length === 0 ? (
                  <div className="text-[13px] text-text-dim pb-2">
                    No bookings today.
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto -mx-4.5 md:mx-0 px-4.5 md:px-0">
                      <table className="w-full text-[13px] border-collapse min-w-190">
                        {tableHead}
                        <tbody>{pageItems.map(renderRow)}</tbody>
                      </table>
                    </div>
                    <Pager
                      page={page}
                      totalPages={totalPages}
                      onChange={(p) =>
                        setPageByDate((prev) => ({ ...prev, [dateKey]: p }))
                      }
                    />
                  </>
                )}
              </div>
            );
          })}

          {remainingDates.length > 0 && (
            <button
              onClick={showMore}
              className="w-full py-3 rounded-xl text-[13px] font-semibold text-text-dim border border-line bg-bg-soft"
            >
              Show previous bookings
            </button>
          )}
        </>
      )}

      <p className="text-[11px] text-text-dim mt-2">
        Member points and hours are only credited once a booking is marked paid.
      </p>
    </>
  );
}
