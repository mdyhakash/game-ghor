import type { CSSProperties } from "react";

interface BracketWinnerProps {
  champion: string;
  style: CSSProperties;
}

export default function BracketWinner({ champion, style }: BracketWinnerProps) {
  return (
    <div
      style={style}
      className="rounded-xl border border-gold bg-(--gold-dim) flex flex-col items-center justify-center text-center px-2.5 stamp-in"
    >
      <div className="text-xl leading-none">🏆</div>
      <div className="text-[12.5px] font-bold text-gold mt-1 truncate w-full">
        {champion}
      </div>
    </div>
  );
}
