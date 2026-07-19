"use client";

import type { CSSProperties } from "react";
import BracketRound from "./BracketRound";
import BracketMatch from "./BracketMatch";
import BracketConnector from "./BracketConnector";
import BracketWinner from "./BracketWinner";

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

const CARD_W = 202;
const CARD_H = 74;
const GAP_H = 18; // vertical space between two sibling leaf matches
const GUTTER = 36; // horizontal space between rounds (where lines live)
const HEADER_H = 26;
const CHAMPION_W = 156;
const CHAMPION_H = 84;
const LINE_COLOR = "var(--line)";

function buildRowOffsets(leaves: number) {
  const totalRows = Math.max(2 * leaves - 1, 1);
  const cum: number[] = [0];
  for (let i = 0; i < totalRows; i++) {
    cum.push(cum[i] + (i % 2 === 0 ? CARD_H : GAP_H));
  }
  return cum;
}

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
        {rounds.map((r) => (
          <BracketRound
            key={`hdr-${r.round}`}
            round={r.round}
            totalRounds={totalRounds}
            matchesInRound={r.matches.length}
            style={{
              position: "absolute",
              top: 0,
              left: colLeft(r.round),
              width: CARD_W,
              height: HEADER_H,
            }}
          />
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

        <BracketConnector lines={lines} />

        {rounds.map((r) =>
          r.matches.map((m) => {
            const y = centerOf(cum, r.round, m.matchIndex) + HEADER_H;
            return (
              <BracketMatch
                key={m.id}
                match={m}
                matchNumber={m.matchIndex + 1}
                onRecordResult={onRecordResult}
                style={{
                  position: "absolute",
                  top: y - CARD_H / 2,
                  left: colLeft(r.round),
                  width: CARD_W,
                  height: CARD_H,
                }}
              />
            );
          }),
        )}

        {champion && finalMatch && (
          <BracketWinner
            champion={champion}
            style={{
              position: "absolute",
              top: centerOf(cum, totalRounds, 0) + HEADER_H - CHAMPION_H / 2,
              left: colLeft(totalRounds) + CARD_W + GUTTER,
              width: CHAMPION_W,
              height: CHAMPION_H,
            }}
          />
        )}
      </div>
    </div>
  );
}
