"use client";

import BottomNav from "@/components/BottomNav";
import { GAMES } from "@/lib/data";

export default function GamesPage() {
  return (
    <div className="pb-6 md:max-w-4xl md:mx-auto">
      <div className="px-[18px] md:px-0 pt-[18px] pb-1">
        <div className="font-display text-xl font-bold">Games available</div>
        <div className="text-xs text-text-dim mt-0.5">
          Everything loaded up and ready to play.
        </div>
      </div>

      <div className="px-[18px] md:px-0 pt-4 grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4">
        {GAMES.map((game) => (
          <div
            key={game.id}
            className={`relative aspect-[3/4] rounded-2xl overflow-hidden border border-line bg-gradient-to-br ${game.color} flex items-end`}
          >
            <span className="absolute top-2 left-2 text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-black/40 backdrop-blur text-white">
              {game.genre}
            </span>
            <div className="w-full p-2.5 bg-gradient-to-t from-black/80 to-transparent">
              <div className="font-display font-bold text-[13px] leading-tight text-white">
                {game.title}
              </div>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
