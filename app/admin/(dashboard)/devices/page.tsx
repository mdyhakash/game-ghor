"use client";

import { useAdminData } from "@/hooks/useAdminData";
import DeviceGrid from "../../DeviceGrid";
import AdminLoading from "@/components/admin/AdminLoading";

export default function AdminDevicesPage() {
  const { devices, refresh, loading } = useAdminData();
  if (loading) return <AdminLoading label="Loading devices…" />;
  return (
    <div className="pb-10">
      <div className="pt-6 pb-4">
        <div className="font-display text-xl font-bold">Devices</div>
        <div className="text-xs text-text-dim mt-0.5">
          Add, edit, retire, or free up devices.
        </div>
      </div>
      <DeviceGrid devices={devices} refresh={refresh} />
    </div>
  );
}
