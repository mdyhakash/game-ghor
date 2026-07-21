"use client";

import { useAdminData } from "@/hooks/useAdminData";
import BookingsTable from "../../BookingsTable";
import AdminLoading from "@/components/admin/AdminLoading";


export default function AdminBookingsPage() {
  const { bookings, devices, now, refresh,loading } = useAdminData();
  if (loading) return <AdminLoading label="Loading bookings..." />;

  return (
    <div className="pb-10">
      <div className="pt-6 pb-4">
        <div className="font-display text-xl font-bold">Bookings</div>
        <div className="text-xs text-text-dim mt-0.5">
          Search, filter, and manage every booking.
        </div>
      </div>
      <BookingsTable
        bookings={bookings}
        devices={devices}
        now={now}
        refresh={refresh}
      />
    </div>
  );
}
