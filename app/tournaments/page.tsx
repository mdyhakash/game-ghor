"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import { getTournaments } from "@/lib/store";

type Tournaments = ReturnType<typeof getTournaments>;

const STATUS_STYLE: Record<string, string> = {
  UPCOMING: "text-gold bg-[var(--gold-dim)] border-gold",
  ONGOING: "text-lime bg-[var(--lime-dim)] border-lime",
  COMPLETED: "text-text-dim bg-bg-soft border-line",
};

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournaments>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    queueMicrotask(() => {
      setTournaments(getTournaments());
      setLoading(false);
    });
  }, []);

  return (
    <div className="pb-6 md:max-w-4xl md:mx-auto">
      <div className="px-[18px] md:px-0 pt-[18px] pb-1">
        <div className="font-display text-xl font-bold">🏆 Tournaments</div>
        <div className="text-xs text-text-dim mt-0.5">
          Fixtures, brackets, and prize pools — open to everyone.
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-text-dim text-[13.5px]">
          Loading…
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-16 text-text-dim text-[13.5px]">
          No tournaments scheduled right now.
          <br />
          Check back soon 🎮
        </div>
      ) : (
        <div className="px-[18px] md:px-0 pt-4 grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {tournaments.map((t) => (
            <Link
              key={t.id}
              href={`/tournaments/${t.id}`}
              className="block bg-card border border-line rounded-2xl p-4 active:scale-[0.98] transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-[15px]">{t.name}</div>
                  <div className="text-xs text-text-dim mt-0.5">
                    {t.gameTitle}
                  </div>
                </div>
                <span
                  className={`text-[10.5px] font-bold px-2 py-1 rounded-full border ${STATUS_STYLE[t.status]}`}
                >
                  {t.status}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 text-[12px] text-text-dim">
                <span>
                  {new Date(t.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span>
                  {t.participantCount}/{t.maxPlayers} players
                </span>
              </div>
              {t.prizePool && (
                <div className="mt-2 text-[12.5px] font-semibold text-gold">
                  🏆 {t.prizePool}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
