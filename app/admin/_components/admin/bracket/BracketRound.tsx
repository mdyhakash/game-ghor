import type { CSSProperties } from "react";

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

interface BracketRoundProps {
  round: number;
  totalRounds: number;
  matchesInRound: number;
  style: CSSProperties;
}

export default function BracketRound({
  round,
  totalRounds,
  matchesInRound,
  style,
}: BracketRoundProps) {
  return (
    <div
      style={style}
      className="text-[11px] font-semibold text-text-dim uppercase tracking-wider flex items-center"
    >
      {roundLabel(round, totalRounds, matchesInRound)}
    </div>
  );
}
