"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RiHomeLine,
  RiHome2Fill,
  RiBookOpenLine,
  RiBookOpenFill,
  RiTicketLine,
  RiTicket2Fill,
} from "react-icons/ri";

const items = [
  { href: "/", label: "Home", icon: RiHomeLine, activeIcon: RiHome2Fill },
  {
    href: "/book",
    label: "Book",
    icon: RiBookOpenLine,
    activeIcon: RiBookOpenFill,
  },
  {
    href: "/my-bookings",
    label: "Tokens",
    icon: RiTicketLine,
    activeIcon: RiTicket2Fill,
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-107.5 bg-bg-soft border-t border-line flex px-3 pt-2.5 pb-4 md:hidden">
      {items.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = active ? item.activeIcon : item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center gap-1 text-[11px] ${
              active ? "text-pink" : "text-text-dim"
            }`}
          >
            <Icon size={22} />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
