"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import BracketView from "@/components/BracketView";
import { getTournamentDetail } from "@/lib/store";

type Detail = NonNullable<ReturnType<typeof getTournamentDetail>>;

const STATUS_STYLE: Record<string, string> = {
  UPCOMING: "text-gold bg-[var(--gold-dim)] border-gold",
  ONGOING: "text-lime bg-[var(--lime-dim)] border-lime",
  COMPLETED: "text-text-dim bg-bg-soft border-line",
};

export default function TournamentDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Detail | null | undefined>(undefined);

  useEffect(() => {
    queueMicrotask(() => {
      setData(getTournamentDetail(params.id));
    });
  }, [params.id]);

  if (data === undefined) {
    return <div className="p-6 text-text-dim text-sm">Loading…</div>;
  }

  if (data === null) {
    return (
      <div className="pb-6 md:max-w-2xl md:mx-auto">
        <div className="px-[18px] md:px-0 pt-[18px] pb-2.5 font-display text-xl">
          Tournament not found
        </div>
        <Link
          href="/tournaments"
          className="mx-[18px] md:mx-0 block text-center py-3.5 rounded-[14px] border border-line text-text font-semibold text-sm"
        >
          Back to tournaments
        </Link>
        <BottomNav />
      </div>
    );
  }

  const { tournament, participants, rounds } = data;
  const champion =
    rounds.length > 0
      ? (rounds[rounds.length - 1].matches[0]?.winnerName ?? null)
      : null;

  return (
    <div className="pb-6 md:max-w-4xl md:mx-auto">
      <div className="flex items-center gap-2.5 px-[18px] md:px-0 pt-4 pb-1.5">
        <Link
          href="/tournaments"
          className="w-[34px] h-[34px] rounded-[10px] bg-card border border-line flex items-center justify-center text-base"
        >
          ←
        </Link>
        <div>
          <div className="font-display text-lg font-bold">
            {tournament.name}
          </div>
          <div className="text-xs text-text-dim">{tournament.gameTitle}</div>
        </div>
      </div>

      <div className="px-[18px] md:px-0 pt-2">
        <div className="bg-card border border-line rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span
              className={`text-[10.5px] font-bold px-2 py-1 rounded-full border ${STATUS_STYLE[tournament.status]}`}
            >
              {tournament.status}
            </span>
            <span className="text-[12px] text-text-dim">
              {new Date(tournament.startDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          {tournament.description && (
            <p className="text-[13px] text-text-dim mt-3">
              {tournament.description}
            </p>
          )}

          <div className="grid grid-cols-3 gap-2.5 mt-4">
            <MiniStat
              label="Players"
              value={`${participants.length}/${tournament.maxPlayers}`}
            />
            <MiniStat
              label="Entry fee"
              value={
                tournament.entryFee > 0 ? `৳${tournament.entryFee}` : "Free"
              }
            />
            <MiniStat
              label="Prize pool"
              value={tournament.prizePool || "—"}
              accent="text-gold"
            />
          </div>

          {champion && (
            <div className="mt-4 flex items-center gap-2 bg-[var(--gold-dim)] border border-gold rounded-xl px-3.5 py-2.5 text-[13px] font-bold text-gold">
              🏆 Champion: {champion}
            </div>
          )}
        </div>
      </div>

      <div className="px-[18px] md:px-0 pt-6 pb-2 text-[12px] tracking-wider text-text-dim uppercase font-semibold">
        Fixture
      </div>
      <div className="px-[18px] md:px-0">
        <BracketView rounds={rounds} />
      </div>

      <div className="px-[18px] md:px-0 pt-6 pb-2 text-[12px] tracking-wider text-text-dim uppercase font-semibold">
        Players ({participants.length})
      </div>
      {participants.length === 0 ? (
        <div className="px-[18px] md:px-0 text-[13px] text-text-dim pb-4">
          No one has joined yet.
        </div>
      ) : (
        <div className="px-[18px] md:px-0 grid grid-cols-2 md:grid-cols-3 gap-2">
          {participants.map((p) => (
            <div
              key={p.id}
              className="bg-card border border-line rounded-xl px-3 py-2 text-[13px] font-semibold"
            >
              {p.name}
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
}

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="text-center">
      <div
        className={`font-display font-bold text-sm ${accent ?? "text-text"}`}
      >
        {value}
      </div>
      <div className="text-[10px] text-text-dim mt-0.5">{label}</div>
    </div>
  );
}
