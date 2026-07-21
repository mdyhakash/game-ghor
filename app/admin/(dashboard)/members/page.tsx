"use client";

import { useAdminData } from "@/hooks/useAdminData";
import MembersTab from "@/components/MembersTab";
import AdminLoading from "@/components/admin/AdminLoading";

export default function AdminMembersPage() {
  const { members, refresh, loading } = useAdminData();
  if (loading) return <AdminLoading label="Loading members..." />;

  return (
    <div className="pb-10">
      <div className="pt-6 pb-4">
        <div className="font-display text-xl font-bold">Members</div>
        <div className="text-xs text-text-dim mt-0.5">
          Approve, create, edit, or remove members.
        </div>
      </div>
      <MembersTab members={members} refresh={refresh} />
    </div>
  );
}
