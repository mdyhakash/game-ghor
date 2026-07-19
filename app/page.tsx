"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import GameIcon from "@/components/GameIcon";
import { DEVICE_META, CAFE_PHONE, CAFE_PHONE_DISPLAY } from "@/lib/data";
import { getDevices, getCurrentMemberView, logout } from "@/lib/store";
import {
  RiUserLine,
  RiLogoutBoxLine,
  RiTrophyLine,
  RiTimeLine,
  RiRadioButtonFill,
  RiArrowRightSLine,
} from "react-icons/ri";
import GamesAvailable from "@/components/GamesAvailable";
import { RiPhoneLine } from "react-icons/ri";
import Footer from "@/components/Footer";

type Device = ReturnType<typeof getDevices>[number];
type Member = ReturnType<typeof getCurrentMemberView>;

export default function HomePage() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [member, setMember] = useState<Member>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    queueMicrotask(() => {
      setDevices(getDevices());
      setMember(getCurrentMemberView());
      setLoading(false);
    });
  }, []);

  function handleLogout() {
    logout();
    setMember(null);
  }

  // Group devices by type so the home screen shows one card per category,
  // like the original preview (rather than 9 separate PC tiles).
  const grouped = devices.reduce<
    Record<string, { total: number; free: number }>
  >((acc, d) => {
    acc[d.type] = acc[d.type] ?? { total: 0, free: 0 };
    acc[d.type].total += 1;
    if (d.isFreeNow) acc[d.type].free += 1;
    return acc;
  }, {});
  const freeCount = devices.filter((d) => d.isFreeNow).length;

  return (
    <div className="pb-6">
      {/* top bar (mobile only — desktop uses SiteHeader) */}
      <div className="flex items-center justify-between px-[18px] pt-[18px] pb-2.5 md:hidden">
        <div className="font-display text-xl flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-lime shadow-[0_0_10px_var(--lime)] pulse-dot" />
          Game Ghor
        </div>
        {member ? (
          <button
            onClick={handleLogout}
            className="text-xs text-text-dim bg-card border border-line px-2.5 py-1.5 rounded-full"
          >
            {member.membershipStatus === "APPROVED" ? (
              <GameIcon iconKey={member.tierInfo.iconKey} size={14} />
            ) : (
              <RiTimeLine size={14} className="inline-block" />
            )}{" "}
            {member.name.split(" ")[0]}
          </button>
        ) : (
          <Link
            href="/login"
            className="text-xs text-text-dim bg-card border border-line px-2.5 py-1.5 rounded-full"
          >
            <RiUserLine size={13} className="inline-block mr-0.5" /> Login
          </Link>
        )}
      </div>

      {/* member status card */}
      {member && (
        <div
          className={`mx-[18px] md:mx-0 mt-2.5 mb-1 p-4 rounded-2xl border flex items-center justify-between md:max-w-sm ${
            member.membershipStatus === "APPROVED"
              ? "border-gold bg-gradient-to-br from-[var(--gold-dim)] to-card"
              : "border-line bg-card"
          }`}
        >
          <div>
            <div className="font-bold text-[15px]">
              {member.membershipStatus === "APPROVED" ? (
                <GameIcon iconKey={member.tierInfo.iconKey} size={16} />
              ) : (
                <RiTimeLine size={16} className="inline-block" />
              )}{" "}
              {member.name}
            </div>
            <div
              className={`text-[11.5px] font-bold mt-0.5 ${
                member.membershipStatus === "APPROVED"
                  ? "text-gold"
                  : "text-text-dim"
              }`}
            >
              {member.membershipStatus === "APPROVED"
                ? `${member.tierInfo.label} · ${Math.round(member.tierInfo.discount * 100)}% off bookings`
                : "Membership pending admin approval"}
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-xl text-gold font-bold">
              {member.points}
            </div>
            <div className="text-[10px] text-text-dim">points</div>
          </div>
        </div>
      )}

      {/* occupancy strip */}
      <div className="mx-[18px] md:mx-0 mt-2.5 mb-1 p-3 rounded-2xl bg-card border border-line flex items-center justify-between text-[13px] text-text-dim md:max-w-sm">
        <span>
          <b className="text-lime font-bold">{loading ? "…" : freeCount}</b>{" "}
          devices free right now
        </span>
        <span>
          <RiRadioButtonFill
            size={12}
            className="inline-block text-lime mr-1"
          />
          open till 1AM
        </span>
        {/* call to book */}
      </div>
      <a
        href={`tel:${CAFE_PHONE}`}
        className="mx-[18px] md:mx-0 mt-2 mb-1 flex items-center justify-center gap-2 p-3 rounded-2xl bg-card border border-line text-[13px] font-semibold text-lime active:scale-[0.98] transition md:max-w-sm"
      >
        <RiPhoneLine size={16} />
        Call to book — {CAFE_PHONE_DISPLAY}
      </a>

      {/* hero */}
      <div className="px-[18px] md:px-0 pt-4 md:pt-8 pb-1.5">
        <h1 className="font-display text-3xl md:text-5xl leading-tight font-bold mb-1">
          Pick your <span className="text-pink">rig.</span>
          <br />
          Lock your slot.
        </h1>
        <p className="text-text-dim text-[13.5px]">
          Just your phone number. No forms, no queueing at the counter.
        </p>
      </div>

      {/* entry cards for guests */}
      {!member && (
        <div className="flex gap-2.5 px-[18px] md:px-0 pt-3 pb-1">
          <div className="flex-1 p-4 rounded-2xl text-center border border-line bg-card">
            <div className="text-xl mb-1.5 flex justify-center">
              <RiTrophyLine size={24} />
            </div>
            <div className="font-bold text-sm">Book as guest</div>
            <div className="text-[11px] text-text-dim mt-1 leading-tight">
              Just your phone number, get a token instantly
            </div>
          </div>
          <Link
            href="/login"
            className="flex-1 p-4 rounded-2xl text-center border border-gold bg-[var(--gold-dim)]"
          >
            <div className="text-xl mb-1.5 flex justify-center text-gold">
              <RiTrophyLine size={24} />
            </div>
            <div className="font-bold text-sm text-gold">Member login</div>
            <div className="text-[11px] text-text-dim mt-1 leading-tight">
              Get your discount + points on this booking
            </div>
          </Link>
        </div>
      )}

      {/* device categories */}
      <div className="px-[18px] md:px-0 pt-5 md:pt-8 pb-2 text-[12px] tracking-wider text-text-dim uppercase font-semibold">
        Choose a device
      </div>
      <div className="px-[18px] md:px-0 grid grid-cols-1 md:grid-cols-3 gap-2.5 md:gap-4">
        {Object.entries(DEVICE_META).map(([type, meta]) => {
          const stats = grouped[type];
          return (
            <button
              key={type}
              onClick={() => router.push(`/book?type=${type}`)}
              className="flex items-center justify-between bg-card border border-line rounded-2xl px-4 py-3.5 text-left active:scale-[0.98] transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-bg-soft flex items-center justify-center text-xl">
                  <GameIcon iconKey={meta.iconKey} size={24} />
                </div>
                <div>
                  <div className="font-bold text-[15px]">{meta.title}</div>
                  <div className="text-xs text-text-dim mt-0.5">{meta.sub}</div>
                </div>
              </div>
              <div className="flex items-center">
                <span
                  className={`text-[11.5px] font-semibold px-2.5 py-1 rounded-full ${
                    stats && stats.free > 0
                      ? "bg-(--lime-dim) text-lime"
                      : "bg-[#3a354622] text-text-dim"
                  }`}
                >
                  {stats ? `${stats.free} free` : "—"}
                </span>
                <span className="text-text-dim ml-2">
                  <RiArrowRightSLine size={18} />
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <GamesAvailable />

      <BottomNav />
      <Footer />
    </div>
  );
}
