"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentMemberView, logout } from "@/lib/store";

const items = [
  { href: "/", label: "Home" },
  { href: "/book", label: "Book a slot" },
  { href: "/my-bookings", label: "My Bookings" },
  { href: "/tournaments", label: "Tournaments" },
];

type Member = ReturnType<typeof getCurrentMemberView>;

export default function Header() {
  const pathname = usePathname();
  const [member, setMember] = useState<Member>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setMember(getCurrentMemberView());
    });
  }, [pathname]);

  function handleLogout() {
    logout();
    setMember(null);
  }

  return (
    <header className="hidden md:block sticky top-0 z-10 border-b border-line bg-bg/90 backdrop-blur">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-8 h-16">
        <div className="flex items-center gap-10">
          <Link
            href="/"
            className="font-display text-xl flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-lime shadow-[0_0_10px_var(--lime)] pulse-dot" />
            LEVEL UP
          </Link>
          <nav className="flex items-center gap-6">
            {items.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-[13.5px] font-semibold ${active ? "text-pink" : "text-text-dim hover:text-text"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {member ? (
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-text-dim bg-card border border-line px-3 py-1.5 rounded-full hover:text-text"
            >
              {member.tierInfo.icon} {member.name.split(" ")[0]} · Log out
            </button>
          ) : (
            <Link
              href="/login"
              className="text-xs font-semibold text-text-dim bg-card border border-line px-3 py-1.5 rounded-full hover:text-text"
            >
              👤 Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
