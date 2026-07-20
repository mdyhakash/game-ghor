import { useState } from "react";
import { createTournament } from "@/lib/store";

const MAX_PLAYERS_OPTIONS = [4, 8, 16, 32];

interface CreateTournamentFormProps {
  onSuccess: (id: string) => void;
}

export default function CreateTournamentForm({
  onSuccess,
}: CreateTournamentFormProps) {
  const [name, setName] = useState("");
  const [gameTitle, setGameTitle] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [entryFee, setEntryFee] = useState(0);
  const [prizePool, setPrizePool] = useState("");
  const [startDate, setStartDate] = useState("");
  const [description, setDescription] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    const result = createTournament({
      name,
      gameTitle,
      maxPlayers,
      entryFee,
      prizePool,
      startDate,
      description,
    });
    if ("error" in result) {
      setCreateError(result.error);
      return;
    }
    setName("");
    setGameTitle("");
    setMaxPlayers(8);
    setEntryFee(0);
    setPrizePool("");
    setStartDate("");
    setDescription("");
    onSuccess(result.tournament.id);
  }

  return (
    <form
      onSubmit={handleCreate}
      className="bg-card border border-line rounded-2xl p-4 mb-4 flex flex-col gap-3"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Tournament name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Friday Night Valorant Cup"
            className="w-full px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px] focus:outline-none focus:border-pink"
          />
        </Field>
        <Field label="Game">
          <input
            value={gameTitle}
            onChange={(e) => setGameTitle(e.target.value)}
            placeholder="Valorant, FIFA, Free Fire…"
            className="w-full px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px] focus:outline-none focus:border-pink"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="Max players">
          <div className="flex gap-1.5">
            {MAX_PLAYERS_OPTIONS.map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setMaxPlayers(n)}
                className={`flex-1 py-2 rounded-lg text-[12.5px] font-semibold border ${
                  maxPlayers === n
                    ? "border-pink bg-(--pink-dim) text-pink"
                    : "border-line bg-bg-soft text-text-dim"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Entry fee (৳)">
          <input
            type="number"
            min={0}
            value={entryFee}
            onChange={(e) => setEntryFee(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px] focus:outline-none focus:border-pink"
          />
        </Field>
        <Field label="Start date">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px] focus:outline-none focus:border-pink"
          />
        </Field>
      </div>

      <Field label="Prize pool">
        <input
          value={prizePool}
          onChange={(e) => setPrizePool(e.target.value)}
          placeholder="৳5,000 + trophy"
          className="w-full px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px] focus:outline-none focus:border-pink"
        />
      </Field>

      <Field label="Description (optional)">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px] focus:outline-none focus:border-pink resize-none"
        />
      </Field>

      {createError && (
        <div className="px-3.5 py-2.5 rounded-[10px] bg-[#ff2e9322] text-pink text-[12.5px] font-semibold">
          {createError}
        </div>
      )}

      <button
        type="submit"
        className="py-2.5 rounded-lg font-display font-bold text-[13px] tracking-wide text-white"
        style={{
          background: "linear-gradient(90deg, var(--pink), var(--purple))",
        }}
      >
        Create tournament
      </button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-text-dim mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
  );
}
