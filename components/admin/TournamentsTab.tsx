import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import type { TournamentModel } from "@/lib/generated/prisma/models";
import type { MatchView } from "@/components/admin/bracket/BracketView";
import TournamentList from "./TournamentList";
import CreateTournamentForm from "./CreateTournamentForm";
import TournamentDetail from "./TournamentDetail";
import RecordResultModal from "./RecordResultModal";

type Tournaments = (TournamentModel & { participantCount: number })[];
type Detail = {
  tournament: TournamentModel;
  participants: {
    id: string;
    tournamentId: string;
    name: string;
    phone: string | null;
  }[];
  rounds: { round: number; matches: MatchView[] }[];
};

export default function TournamentsTab() {
  const [tournaments, setTournaments] = useState<Tournaments>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [resultMatch, setResultMatch] = useState<MatchView | null>(null);

  const refresh = useCallback(() => {
    api
      .get<Tournaments>("/tournaments")
      .then((res) => setTournaments(res.data));
    if (selectedId) {
      api
        .get<Detail>(`/tournaments/${selectedId}`)
        .then((res) => setDetail(res.data));
    }
  }, [selectedId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function handleCreateSuccess(newId: string) {
    setShowCreate(false);
    setSelectedId(newId);
    api
      .get<Tournaments>("/tournaments")
      .then((res) => setTournaments(res.data));
  }

  async function handleRecordResultSubmit(
    winnerId: string,
    scoreA?: number,
    scoreB?: number,
  ) {
    if (!selectedId || !resultMatch) return;
    await api.post(
      `/admin/tournaments/${selectedId}/matches/${resultMatch.id}/result`,
      {
        winnerId,
        scoreA,
        scoreB,
      },
    );
    setResultMatch(null);
    refresh();
  }

  return (
    <div>
      <TournamentList
        tournaments={tournaments}
        selectedId={selectedId}
        showCreate={showCreate}
        onToggleCreate={() => setShowCreate((v) => !v)}
        onSelect={(id) => setSelectedId(id)}
      />

      {showCreate && <CreateTournamentForm onSuccess={handleCreateSuccess} />}

      {detail && (
        <TournamentDetail
          detail={detail}
          onRefresh={refresh}
          onRecordResult={(match) => setResultMatch(match)}
        />
      )}

      {resultMatch && (
        <RecordResultModal
          match={resultMatch}
          onClose={() => setResultMatch(null)}
          onSubmit={handleRecordResultSubmit}
        />
      )}
    </div>
  );
}
