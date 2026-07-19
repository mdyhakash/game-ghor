"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAdminLoggedIn, adminLogout } from "@/lib/store";
import { useAdminData } from "./_hooks/useAdminData";
import OverviewTab from "./_components/OverviewTab";
import MembersTab from "./_components/MembersTab";
import TournamentsTab from "./_components/admin/TournamentsTab";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [tab, setTab] = useState<"overview" | "members" | "tournaments">(
    "overview",
  );

  const { devices, bookings, stats, members, now, refresh } = useAdminData();

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

  function handleLogout() {
    adminLogout();
    router.push("/admin/login");
  }

  if (!checked || !stats) {
    return <div className="p-6 text-text-dim text-sm">Loading…</div>;
  }

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
        {(["overview", "members", "tournaments"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold border capitalize ${
              tab === t
                ? "border-pink bg-[var(--pink-dim)] text-pink"
                : "border-line bg-card text-text-dim"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <OverviewTab
          devices={devices}
          bookings={bookings}
          stats={stats}
          now={now}
          refresh={refresh}
        />
      )}

      {tab === "members" && <MembersTab members={members} refresh={refresh} />}

      {tab === "tournaments" && <TournamentsTab />}
    </div>
  );
}
