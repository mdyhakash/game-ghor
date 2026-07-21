"use client";

import { useAdminData } from "@/hooks/useAdminData";

import AdminLoading from "@/components/admin/AdminLoading";
import GameGrid from "../../GameGrid";

export default function AdminGamesPage() {
  const { games, refresh, loading } = useAdminData();
  if (loading) return <AdminLoading label="Loading games…" />;
  return (
    <div className="pb-10">
      <div className="pt-6 pb-4">
        <div className="font-display text-xl font-bold">Games</div>
        <div className="text-xs text-text-dim mt-0.5">
          Add, edit, or retire games shown on the site.
        </div>
      </div>
      <GameGrid games={games} refresh={refresh} />
    </div>
  );
}
