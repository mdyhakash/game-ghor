import { useState, useEffect } from "react";
import {
  getAdminDevices,
  getAllBookings,
  getAdminStats,
  getAllMembers,
  updateBookingStatus,
} from "@/lib/store";

type Devices = ReturnType<typeof getAdminDevices>;
type Bookings = ReturnType<typeof getAllBookings>;
type Stats = ReturnType<typeof getAdminStats>;
type Members = ReturnType<typeof getAllMembers>;

export function useAdminData() {
  const [devices, setDevices] = useState<Devices>([]);
  const [bookings, setBookings] = useState<Bookings>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [members, setMembers] = useState<Members>([]);
  const [now, setNow] = useState(() => Date.now());

  function refresh() {
    setDevices(getAdminDevices());
    setBookings(getAllBookings());
    setStats(getAdminStats());
    setMembers(getAllMembers());
  }

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
  }, []);

  return {
    devices,
    bookings,
    stats,
    members,
    now,
    refresh,
  };
}
export type { Devices, Bookings, Stats, Members };
