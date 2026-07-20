import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import type { DeviceView } from "@/lib/types";
import type { BookingModel, DeviceModel } from "@/lib/generated/prisma/models";

type BookingRow = BookingModel & {
  device: DeviceModel | null;
  customerLabel: string;
};

export type Devices = DeviceView[];
export type Bookings = BookingRow[];
export type Stats = {
  devicesFree: number;
  devicesTotal: number;
  bookingsToday: number;
  revenueToday: number;
  totalMembers: number;
};
export type MemberRow = {
  id: string;
  name: string;
  phone: string;
  points: number;
  membershipStatus: string;
  createdAt: string;
  visitCount: number;
};
export type Members = MemberRow[];

export function useAdminData() {
  const [devices, setDevices] = useState<Devices>([]);
  const [bookings, setBookings] = useState<Bookings>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [members, setMembers] = useState<Members>([]);
  const [now, setNow] = useState(() => Date.now());

  const refresh = useCallback(() => {
    api.get<Devices>("/devices").then((res) => setDevices(res.data));
    api.get<Bookings>("/admin/bookings").then((res) => setBookings(res.data));
    api.get<Stats>("/admin/stats").then((res) => setStats(res.data));
    api.get<Members>("/admin/members").then((res) => setMembers(res.data));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      api.get<Bookings>("/admin/bookings").then((res) => {
        const current = res.data;
        const expired = current.filter(
          (b) =>
            b.status === "ACTIVE" &&
            new Date(b.endTime).getTime() <= Date.now(),
        );
        if (expired.length > 0) {
          Promise.all(
            expired.map((b) =>
              api.patch(`/admin/bookings/${b.id}/status`, {
                status: "COMPLETED",
              }),
            ),
          ).then(refresh);
        } else {
          setNow(Date.now());
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { devices, bookings, stats, members, now, refresh };
}
