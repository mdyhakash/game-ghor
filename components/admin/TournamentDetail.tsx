import { useState } from "react";
import { api, getErrorMessage } from "@/lib/api-client";
import BracketView, {
  type MatchView,
} from "@/components/admin/bracket/BracketView";
import ParticipantForm from "./ParticipantForm";

type Detail = NonNullable<ReturnType<typeof getTournamentDetail>>;

const STATUS_STYLE: Record<string, string> = {
  UPCOMING: "text-gold bg-[var(--gold-dim)] border-gold",
  ONGOING: "text-lime bg-[var(--lime-dim)] border-lime",
  COMPLETED: "text-text-dim bg-bg-soft border-line",
};

interface TournamentDetailProps {
  detail: Detail;
  onRefresh: () => void;
  onRecordResult: (match: MatchView) => void;
}

export default function TournamentDetail({
  detail,
  onRefresh,
  onRecordResult,
}: TournamentDetailProps) {
  const [fixtureError, setFixtureError] = useState<string | null>(null);

  async function handleGenerateFixture() {
    setFixtureError(null);
    try {
      await api.post(`/admin/tournaments/${detail.tournament.id}/generate`);
      onRefresh();
    } catch (err) {
      setFixtureError(getErrorMessage(err));
    }
  }

  return (
    <div className="bg-card border border-line rounded-2xl p-4">
      <div className="flex items-start justify-between mb-1">
        <div className="font-display text-lg font-bold">
          {detail.tournament.name}
        </div>
        <span
          className={`text-[10.5px] font-bold px-2 py-1 rounded-full border ${STATUS_STYLE[detail.tournament.status]}`}
        >
          {detail.tournament.status}
        </span>
      </div>
      <div className="text-xs text-text-dim mb-4">
        {detail.tournament.gameTitle} ·{" "}
        {new Date(detail.tournament.startDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </div>

      <ParticipantForm
        tournamentId={detail.tournament.id}
        participants={detail.participants}
        status={detail.tournament.status}
        onRefresh={onRefresh}
      />

      {detail.tournament.status === "UPCOMING" && (
        <button
          onClick={handleGenerateFixture}
          disabled={detail.participants.length < 2}
          className="w-full py-3 rounded-xl font-display font-bold text-[13.5px] tracking-wide text-white disabled:opacity-40"
          style={{
            background: "linear-gradient(90deg, var(--pink), var(--purple))",
          }}
        >
          🎲 Auto-generate fixture ({detail.participants.length} players)
        </button>
      )}
      {fixtureError && (
        <div className="mt-2 px-3.5 py-2.5 rounded-[10px] bg-[#ff2e9322] text-pink text-[12.5px] font-semibold">
          {fixtureError}
        </div>
      )}

      {detail.rounds.length > 0 && (
        <div className="mt-5">
          <BracketView rounds={detail.rounds} onRecordResult={onRecordResult} />
        </div>
      )}
    </div>
  );
}
