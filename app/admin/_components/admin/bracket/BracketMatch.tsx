import type { CSSProperties } from "react";
import type { MatchView } from "./BracketView";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function PlayerRow({
  name,
  isWinner,
  isLoser,
  isBye,
  score,
}: {
  name: string | null;
  isWinner: boolean;
  isLoser: boolean;
  isBye: boolean;
  score: number | null;
}) {
  const label = name ?? (isBye ? "BYE" : "TBD");
  return (
    <div
      className={`flex items-center gap-1.5 h-1/2 px-2.5 ${
        isWinner ? "bg-[var(--lime-dim)]" : ""
      }`}
    >
      <div
        className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
          name
            ? isWinner
              ? "bg-lime text-black"
              : "bg-taken text-text-dim"
            : "bg-taken text-text-dim"
        }`}
      >
        {name ? initials(name) : "—"}
      </div>
      <span
        className={`flex-1 truncate text-[12.5px] ${
          isWinner
            ? "font-bold text-lime"
            : isLoser
              ? "text-text-dim line-through decoration-[var(--line)]"
              : !name
                ? "text-text-dim italic"
                : "text-text"
        }`}
      >
        {label}
      </span>
      {score !== null && (
        <span
          className={`text-[11px] font-bold shrink-0 ${isWinner ? "text-lime" : "text-text-dim"}`}
        >
          {score}
        </span>
      )}
    </div>
  );
}

interface BracketMatchProps {
  match: MatchView;
  matchNumber: number;
  onRecordResult?: (match: MatchView) => void;
  style: CSSProperties;
}

export default function BracketMatch({
  match,
  matchNumber,
  onRecordResult,
  style,
}: BracketMatchProps) {
  const bothKnown = !!match.participantAId && !!match.participantBId;
  const isBye = match.status === "COMPLETED" && !bothKnown;
  const isWaiting = match.status === "PENDING" && !bothKnown;
  const isReady = match.status === "PENDING" && bothKnown;
  const isDone = match.status === "COMPLETED" && bothKnown;

  const winA =
    match.winnerId !== null && match.winnerId === match.participantAId;
  const winB =
    match.winnerId !== null && match.winnerId === match.participantBId;

  return (
    <div style={style}>
      <div
        className={`relative h-full rounded-xl border overflow-hidden bg-card ${
          isWaiting ? "border-dashed border-line opacity-60" : "border-line"
        }`}
      >
        <div className="absolute top-1 left-2 text-[9px] text-text-dim font-semibold tracking-wide z-10">
          M{matchNumber}
        </div>
        {isReady && onRecordResult && (
          <button
            onClick={() => onRecordResult(match)}
            className="absolute top-1 right-1.5 z-10 text-[9px] font-bold text-gold bg-[var(--gold-dim)] border border-gold px-1.5 py-0.5 rounded-full flex items-center gap-1"
          >
            <span className="w-[5px] h-[5px] rounded-full bg-gold pulse-dot" />
            RECORD
          </button>
        )}
        {isReady && !onRecordResult && (
          <div className="absolute top-1.5 right-2 flex items-center gap-1 z-10">
            <span className="w-[5px] h-[5px] rounded-full bg-gold pulse-dot" />
            <span className="text-[9px] text-gold font-bold">READY</span>
          </div>
        )}
        <div className="pt-3.5 h-full flex flex-col">
          <PlayerRow
            name={match.participantAName}
            isWinner={winA}
            isLoser={isDone && winB}
            isBye={isBye}
            score={match.scoreA}
          />
          <div className="h-px bg-line mx-2.5" />
          <PlayerRow
            name={match.participantBName}
            isWinner={winB}
            isLoser={isDone && winA}
            isBye={isBye}
            score={match.scoreB}
          />
        </div>
      </div>
    </div>
  );
}
