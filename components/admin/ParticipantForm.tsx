import { useState } from "react";
import { api, getErrorMessage } from "@/lib/api-client";
import type { Participant } from "@/lib/data";

type ParticipantFormParticipant = {
  id: string;
  tournamentId: string;
  name: string;
  phone: string | null;
};
interface ParticipantFormProps {
  tournamentId: string;
  participants: ParticipantFormParticipant[];
  status: string;
  onRefresh: () => void;
}

export default function ParticipantForm({
  tournamentId,
  participants,
  status,
  onRefresh,
}: ParticipantFormProps) {
  const [playerName, setPlayerName] = useState("");
  const [playerPhone, setPlayerPhone] = useState("");
  const [playerError, setPlayerError] = useState<string | null>(null);

  async function handleAddPlayer(e: React.FormEvent) {
    e.preventDefault();
    setPlayerError(null);
    try {
      await api.post(`/admin/tournaments/${tournamentId}/participents`, {
        name: playerName,
        phone: playerPhone,
      });
      setPlayerName("");
      setPlayerPhone("");
      onRefresh();
    } catch (err) {
      setPlayerError(getErrorMessage(err));
    }
  }

  async function handleRemovePlayer(participantId: string) {
    await api.delete(
      `/admin/tournaments/${tournamentId}/participents/${participantId}`,
    );
    onRefresh();
  }

  // ...rest of your JSX is unchanged.

  return (
    <div>
      {status === "UPCOMING" && (
        <>
          <form
            onSubmit={handleAddPlayer}
            className="flex flex-col sm:flex-row gap-2 mb-3"
          >
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Player / team name"
              className="flex-1 px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px] focus:outline-none focus:border-pink"
            />
            <input
              value={playerPhone}
              onChange={(e) => setPlayerPhone(e.target.value)}
              placeholder="Phone (optional)"
              className="flex-1 px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px] focus:outline-none focus:border-pink"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg font-semibold text-[12.5px] text-white whitespace-nowrap"
              style={{
                background:
                  "linear-gradient(90deg, var(--pink), var(--purple))",
              }}
            >
              Add player
            </button>
          </form>
          {playerError && (
            <div className="mb-3 px-3.5 py-2.5 rounded-[10px] bg-[#ff2e9322] text-pink text-[12.5px] font-semibold">
              {playerError}
            </div>
          )}
        </>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {participants.map((p) => (
          <span
            key={p.id}
            className="inline-flex items-center gap-1.5 bg-bg-soft border border-line rounded-full pl-3 pr-1.5 py-1 text-[12.5px]"
          >
            {p.name}
            {status === "UPCOMING" && (
              <button
                onClick={() => handleRemovePlayer(p.id)}
                className="text-text-dim hover:text-pink text-sm leading-none px-1"
              >
                ×
              </button>
            )}
          </span>
        ))}
        {participants.length === 0 && (
          <span className="text-[12.5px] text-text-dim">No players yet.</span>
        )}
      </div>
    </div>
  );
}
