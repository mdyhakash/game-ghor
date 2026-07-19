"use client";

import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import { getCurrentMember, getMyBookings } from "@/lib/store";

type Bookings = NonNullable<ReturnType<typeof getMyBookings>>;

export default function MyBookingsPage() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [bookings, setBookings] = useState<Bookings>([]);

  useEffect(() => {
    queueMicrotask(() => {
      const member = getCurrentMember();
      setLoggedIn(!!member);
      setBookings(getMyBookings() ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="pb-6 md:max-w-2xl md:mx-auto">
        <div className="px-[18px] md:px-0 pt-[18px] pb-2.5 font-display text-xl">My Bookings</div>
        <BottomNav />
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="pb-6 md:max-w-2xl md:mx-auto">
        <div className="px-[18px] md:px-0 pt-[18px] pb-2.5 font-display text-xl">My Bookings</div>
        <div className="text-center px-8 py-16 text-text-dim text-[13.5px]">
          Log in as a member to see your booking history.
          <br />
          Guest bookings aren&apos;t saved.
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="pb-6 md:max-w-2xl md:mx-auto">
      <div className="px-[18px] md:px-0 pt-[18px] pb-2.5 font-display text-xl">My Bookings</div>

      {bookings.length === 0 ? (
        <div className="text-center px-8 py-16 text-text-dim text-[13.5px]">
          No tokens yet.
          <br />
          Go book a slot 🎮
        </div>
      ) : (
        <div className="px-[18px] md:px-0 grid grid-cols-1 md:grid-cols-2 gap-3">
          {bookings.map((b) => {
            const startLabel = new Date(b.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
            const endLabel = new Date(b.endTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
            return (
              <div
                key={b.id}
                className="flex justify-between items-center bg-card border border-line rounded-2xl px-4 py-3.5"
              >
                <div>
                  <div className="font-bold text-sm">{b.device?.name ?? "Device"}</div>
                  <div className="text-xs text-text-dim mt-0.5">
                    {startLabel} – {endLabel} · {b.durationHrs}h
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-xl text-lime">#{b.token}</div>
                  <div
                    className={`text-[10.5px] mt-0.5 ${
                      b.status === "COMPLETED" ? "text-text-dim" : "text-lime"
                    }`}
                  >
                    {b.status}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
