"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: "📊" },
  { href: "/admin/devices", label: "Devices", icon: "🖥️" },
  { href: "/admin/bookings", label: "Bookings", icon: "🎟️" },
  { href: "/admin/members", label: "Members", icon: "👥" },
  { href: "/admin/tournaments", label: "Tournaments", icon: "🏆" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await api.post("/admin/auth/logout");
    router.push("/admin/login");
  }

  return (
    <>
      {/* desktop: fixed left sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-56 md:shrink-0 md:h-screen md:sticky md:top-0 border-r border-line bg-card px-3 py-5">
        <div className="px-2 pb-6">
          <div className="font-display text-lg font-bold">Level Up</div>
          <div className="text-[11px] text-text-dim mt-0.5">Admin panel</div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13.5px] font-semibold ${
                  active
                    ? "bg-(--pink-dim) text-pink"
                    : "text-text-dim hover:bg-bg-soft"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-1 pt-4 border-t border-line">
          <Link
            href="/"
            className="px-3 py-2.5 rounded-xl text-[13px] font-semibold text-text-dim hover:bg-bg-soft"
          >
            ← Back to site
          </Link>
          <button
            onClick={handleLogout}
            className="text-left px-3 py-2.5 rounded-xl text-[13px] font-semibold text-text-dim hover:bg-bg-soft"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* mobile: horizontal scroll strip up top */}
      <div className="md:hidden sticky top-0 z-10 bg-card border-b border-line overflow-x-auto">
        <div className="flex items-center gap-1 px-3 py-2 min-w-max">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-semibold whitespace-nowrap ${
                  active
                    ? "bg-(--pink-dim) text-pink"
                    : "text-text-dim bg-bg-soft"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-full text-[12.5px] font-semibold text-text-dim bg-bg-soft whitespace-nowrap"
          >
            Log out
          </button>
        </div>
      </div>
    </>
  );
}
