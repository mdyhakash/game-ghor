"use client";

import { useAdminData } from "@/hooks/useAdminData";
import StatCard from "@/components/StatCard";

import AdminLoading from "@/components/admin/AdminLoading";
import WalkInBookingForm from "../WalkInBookingForm";

export default function AdminOverviewPage() {
  const { devices, stats, refresh, loading } = useAdminData();

  if (loading || !stats) {
    return <AdminLoading label="Loading overview…" />;
  }

  return (
    <div className="pb-10">
      <div className="pt-6 pb-4">
        <div className="font-display text-xl font-bold">Overview</div>
        <div className="text-xs text-text-dim mt-0.5">Today at a glance.</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-7">
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

      <WalkInBookingForm devices={devices} onBooked={refresh} />
    </div>
  );
}
