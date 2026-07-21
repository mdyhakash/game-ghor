"use client";

import TournamentsTab from "@/components/admin/TournamentsTab";

export default function AdminTournamentsPage() {
  return (
    <div className="pb-10">
      <div className="pt-6 pb-4">
        <div className="font-display text-xl font-bold">Tournaments</div>
        <div className="text-xs text-text-dim mt-0.5">
          Create brackets and record match results.
        </div>
      </div>
      <TournamentsTab />
    </div>
  );
}
