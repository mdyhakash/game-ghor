import type { Tournament } from "@/lib/data";

type Tournaments = (Tournament & { participantCount: number })[];

const STATUS_STYLE: Record<string, string> = {
  UPCOMING: "text-gold bg-[var(--gold-dim)] border-gold",
  ONGOING: "text-lime bg-[var(--lime-dim)] border-lime",
  COMPLETED: "text-text-dim bg-bg-soft border-line",
};

interface TournamentListProps {
  tournaments: Tournaments;
  selectedId: string | null;
  showCreate: boolean;
  onToggleCreate: () => void;
  onSelect: (id: string) => void;
}

export default function TournamentList({
  tournaments,
  selectedId,
  showCreate,
  onToggleCreate,
  onSelect,
}: TournamentListProps) {
  return (
    <div>
      <div className="flex items-center justify-between pb-3">
        <div className="text-[12px] tracking-wider text-text-dim uppercase font-semibold">
          Tournaments
        </div>
        <button
          onClick={onToggleCreate}
          className="text-[11.5px] font-bold text-white px-3 py-1.5 rounded-full whitespace-nowrap"
          style={{
            background: "linear-gradient(90deg, var(--pink), var(--purple))",
          }}
        >
          {showCreate ? "Cancel" : "+ New tournament"}
        </button>
      </div>

      {tournaments.length === 0 ? (
        <div className="text-center py-10 text-text-dim text-[13.5px]">
          No tournaments yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 mb-6">
          {tournaments.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`text-left bg-card border rounded-2xl p-3.5 ${
                selectedId === t.id ? "border-pink" : "border-line"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="font-bold text-sm">{t.name}</div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[t.status]}`}
                >
                  {t.status}
                </span>
              </div>
              <div className="text-[11.5px] text-text-dim mt-1">
                {t.gameTitle} · {t.participantCount}/{t.maxPlayers} players
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
