"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import BottomNav from "@/components/BottomNav";
import { api } from "@/lib/api-client";

type Game = {
  id: string;
  name: string;
  genre: string;
  imageUrl: string;
};

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    api.get<Game[]>("/games").then((res) => setGames(res.data));
  }, []);

  return (
    <div className="pb-6 md:max-w-4xl md:mx-auto">
      <div className="px-4.5 md:px-0 pt-4.5 pb-1">
        <div className="font-display text-xl font-bold">Games available</div>
        <div className="text-xs text-text-dim mt-0.5">
          Everything loaded up and ready to play.
        </div>
      </div>

      <div className="px-4.5 md:px-0 pt-4 grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4">
        {games.map((game) => (
          <div
            key={game.id}
            className="relative aspect-3/4 rounded-2xl overflow-hidden border border-line flex items-end"
          >
            <Image
              src={game.imageUrl}
              alt={game.name}
              fill
              className="object-cover"
            />
            <span className="absolute top-2 left-2 text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-black/40 backdrop-blur text-white z-10">
              {game.genre}
            </span>
            <div className="relative z-10 w-full p-2.5 bg-linear-to-t from-black/80 to-transparent">
              <div className="font-display font-bold text-[13px] leading-tight text-white">
                {game.name}
              </div>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
