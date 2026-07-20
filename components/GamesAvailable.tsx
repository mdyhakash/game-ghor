"use client";

import Link from "next/link";
import { GAMES } from "@/lib/data";


const PREVIEW_COUNT = 6;

export default function GamesAvailable() {
  const preview = GAMES.slice(0, PREVIEW_COUNT);

  return (
    <div className="px-4.5 md:px-0 pt-5 md:pt-8 pb-2">
      <div className="text-[12px] tracking-wider text-text-dim uppercase font-semibold mb-2">
        Games available
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4">
        {preview.map((game) => (
          <div
            key={game.id}
            className={`relative aspect-3/4 rounded-2xl overflow-hidden border border-line bg-linear-to-br ${game.color} flex items-end`}
          >
            <span className="absolute top-2 left-2 text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-black/40 backdrop-blur text-white">
              {game.genre}
            </span>
            <div className="w-full p-2.5 bg-linear-to-t from-black/80 to-transparent">
              <div className="font-display font-bold text-[13px] leading-tight text-white">
                {game.title}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/games"
        className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-full border border-line bg-lime text-[12.5px] font-semibold text-black active:scale-[0.98] transition"
      >
        See all games
      </Link>
    </div>
  );
}
