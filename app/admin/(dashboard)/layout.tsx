"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import AdminSidebar from "@/app/admin/AdminSidebar";
import AdminLoading from "@/components/admin/AdminLoading";
import { ToastProvider } from "@/components/Toast";
export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    api
      .get<{ isAdmin: boolean }>("/admin/auth/me")
      .then((res) => {
        if (!res.data.isAdmin) {
          router.replace("/admin/login");
          return;
        }
        setChecked(true);
      })
      .catch(() => router.replace("/admin/login"));
  }, [router]);

  if (!checked) {
    return <AdminLoading label="Checking admin session…" />;
  }

  return (
    <ToastProvider>
      <div className="md:flex">
        <AdminSidebar />
        <div className="flex-1 min-w-0 px-4.5 md:px-6">{children}</div>
      </div>
    </ToastProvider>
  );
}
