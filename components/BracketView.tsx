"use client";

import type { CSSProperties } from "react";

export type MatchView = {
  id: string;
  round: number;
  matchIndex: number;
  participantAId: string | null;
  participantBId: string | null;
  participantAName: string | null;
  participantBName: string | null;
  winnerId: string | null;
  scoreA: number | null;
  scoreB: number | null;
  status: "PENDING" | "COMPLETED";
};

export type RoundView = { round: number; matches: MatchView[] };

// ---------------------------------------------------------------------
// Layout constants (all pixel-exact — no DOM measuring needed). The tree
// is laid out with plain math: every match's vertical center is exactly
// the midpoint of its two feeder matches, all the way down to the leaves.
// ---------------------------------------------------------------------
const CARD_W = 202;
const CARD_H = 74;
const GAP_H = 18; // vertical space between two sibling leaf matches
const GUTTER = 36; // horizontal space between rounds (where lines live)
const HEADER_H = 26;
const CHAMPION_W = 156;
const CHAMPION_H = 84;
const LINE_COLOR = "var(--line)";

function roundLabel(
  round: number,
  totalRounds: number,
  matchesInRound: number,
) {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semifinal";
  if (fromEnd === 2) return "Quarterfinal";
  return `Round of ${matchesInRound * 2}`;
}

/** Cumulative pixel offsets of the fine-grained row grid (leaf rows +
 * gap rows in between). cum[k] = total height of the first k rows. */
function buildRowOffsets(leaves: number) {
  const totalRows = Math.max(2 * leaves - 1, 1);
  const cum: number[] = [0];
  for (let i = 0; i < totalRows; i++) {
    cum.push(cum[i] + (i % 2 === 0 ? CARD_H : GAP_H));
  }
  return cum;
}

/** Vertical center (px) of a match, computed as the exact midpoint of
 * its two feeder matches — recursively true all the way to the leaves. */
function centerOf(cum: number[], round: number, matchIndex: number) {
  const span = 2 ** round - 1;
  const start = matchIndex * 2 ** round;
  const top = cum[start];
  const bottom = cum[start + span];
  return (top + bottom) / 2;
}

function colLeft(round: number) {
  return (round - 1) * (CARD_W + GUTTER);
}

export default function BracketView({
  rounds,
  onRecordResult,
}: {
  rounds: RoundView[];
  /** Pass this to render a "Record result" button on matches admin can decide. Omit for read-only (public) view. */
  onRecordResult?: (match: MatchView) => void;
}) {
  if (rounds.length === 0) {
    return (
      <div className="text-center py-10 text-text-dim text-[13.5px] border border-dashed border-line rounded-2xl">
        Fixture not generated yet.
      </div>
    );
  }

  const totalRounds = rounds.length;
  const leaves = rounds[0].matches.length;
  const cum = buildRowOffsets(leaves);
  const totalRows = Math.max(2 * leaves - 1, 1);

  const finalMatch = rounds[totalRounds - 1]?.matches[0];
  const champion =
    finalMatch && finalMatch.winnerId
      ? finalMatch.winnerId === finalMatch.participantAId
        ? finalMatch.participantAName
        : finalMatch.participantBName
      : null;

  const width =
    colLeft(totalRounds) + CARD_W + (champion ? GUTTER + CHAMPION_W : 0);
  const height = cum[totalRows] + HEADER_H;

  // Elbow connectors: a short stub out of each non-final match, a matching
  // stub into each non-first match, and a vertical bar joining the two
  // stubs at the midpoint between rounds.
  const lines: { key: string; style: CSSProperties }[] = [];
  for (const r of rounds) {
    const round = r.round;
    for (const m of r.matches) {
      const y = centerOf(cum, round, m.matchIndex) + HEADER_H;
      if (round < totalRounds) {
        lines.push({
          key: `out-${m.id}`,
          style: {
            position: "absolute",
            top: y,
            left: colLeft(round) + CARD_W,
            width: GUTTER / 2,
            height: 1,
            background: LINE_COLOR,
          },
        });
      }
      if (round > 1) {
        const xMid = colLeft(round) - GUTTER / 2;
        lines.push({
          key: `in-${m.id}`,
          style: {
            position: "absolute",
            top: y,
            left: xMid,
            width: GUTTER / 2,
            height: 1,
            background: LINE_COLOR,
          },
        });
        const yTop = centerOf(cum, round - 1, m.matchIndex * 2) + HEADER_H;
        const yBottom =
          centerOf(cum, round - 1, m.matchIndex * 2 + 1) + HEADER_H;
        lines.push({
          key: `bar-${m.id}`,
          style: {
            position: "absolute",
            top: Math.min(yTop, yBottom),
            left: xMid,
            width: 1,
            height: Math.abs(yBottom - yTop),
            background: LINE_COLOR,
          },
        });
      }
    }
  }
  if (champion && finalMatch) {
    const y = centerOf(cum, totalRounds, 0) + HEADER_H;
    lines.push({
      key: "champion-stub",
      style: {
        position: "absolute",
        top: y,
        left: colLeft(totalRounds) + CARD_W,
        width: GUTTER / 2,
        height: 1,
        background: LINE_COLOR,
      },
    });
  }

  return (
    <div className="overflow-x-auto pb-2 -mx-[18px] px-[18px] md:mx-0 md:px-0">
      <div style={{ position: "relative", width, height }}>
        {/* round headers */}
        {rounds.map((r) => (
          <div
            key={`hdr-${r.round}`}
            style={{
              position: "absolute",
              top: 0,
              left: colLeft(r.round),
              width: CARD_W,
              height: HEADER_H,
            }}
            className="text-[11px] font-semibold text-text-dim uppercase tracking-wider flex items-center"
          >
            {roundLabel(r.round, totalRounds, r.matches.length)}
          </div>
        ))}
        {champion && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: colLeft(totalRounds) + CARD_W + GUTTER,
              width: CHAMPION_W,
              height: HEADER_H,
            }}
            className="text-[11px] font-semibold text-gold uppercase tracking-wider flex items-center"
          >
            Champion
          </div>
        )}

        {/* connector lines */}
        {lines.map((l) => (
          <div key={l.key} style={l.style} />
        ))}

        {/* match cards */}
        {rounds.map((r) =>
          r.matches.map((m) => {
            const y = centerOf(cum, r.round, m.matchIndex) + HEADER_H;
            return (
              <div
                key={m.id}
                style={{
                  position: "absolute",
                  top: y - CARD_H / 2,
                  left: colLeft(r.round),
                  width: CARD_W,
                  height: CARD_H,
                }}
              >
                <MatchCard
                  match={m}
                  matchNumber={m.matchIndex + 1}
                  onRecordResult={onRecordResult}
                />
              </div>
            );
          }),
        )}

        {/* champion card */}
        {champion && finalMatch && (
          <div
            style={{
              position: "absolute",
              top: centerOf(cum, totalRounds, 0) + HEADER_H - CHAMPION_H / 2,
              left: colLeft(totalRounds) + CARD_W + GUTTER,
              width: CHAMPION_W,
              height: CHAMPION_H,
            }}
            className="rounded-xl border border-gold bg-[var(--gold-dim)] flex flex-col items-center justify-center text-center px-2.5 stamp-in"
          >
            <div className="text-xl leading-none">🏆</div>
            <div className="text-[12.5px] font-bold text-gold mt-1 truncate w-full">
              {champion}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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

function MatchCard({
  match,
  matchNumber,
  onRecordResult,
}: {
  match: MatchView;
  matchNumber: number;
  onRecordResult?: (match: MatchView) => void;
}) {
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
  );
}
