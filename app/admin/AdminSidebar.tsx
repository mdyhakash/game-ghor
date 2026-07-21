"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  RiDashboardLine,
  RiComputerLine,
  RiTicketLine,
  RiTeamLine,
  RiTrophyLine,
  RiGamepadLine,
} from "react-icons/ri";
const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: RiDashboardLine },
  { href: "/admin/devices", label: "Devices", icon: RiComputerLine },
  { href: "/admin/bookings", label: "Bookings", icon: RiTicketLine },
  { href: "/admin/members", label: "Members", icon: RiTeamLine },
  { href: "/admin/tournaments", label: "Tournaments", icon: RiTrophyLine },
  { href: "/admin/games", label: "Games", icon: RiGamepadLine },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  async function handleLogout() {
    await signOut({ callbackUrl: "/admin/login" });
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
            const Icon = item.icon;
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
                <Icon className="w-5 h-5 shrink-0" />
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-line">
        <div className="grid grid-cols-5 h-16">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                  active ? "text-pink" : "text-text-dim"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
