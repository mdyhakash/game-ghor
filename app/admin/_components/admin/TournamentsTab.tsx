import { useEffect, useState } from "react";
import { getTournaments, getTournamentDetail, recordMatchResult } from "@/lib/store";
import type { MatchView } from "@/components/admin/bracket/BracketView";
import TournamentList from "./TournamentList";
import CreateTournamentForm from "./CreateTournamentForm";
import TournamentDetail from "./TournamentDetail";
import RecordResultModal from "./RecordResultModal";

type Tournaments = ReturnType<typeof getTournaments>;
type Detail = NonNullable<ReturnType<typeof getTournamentDetail>>;

export default function TournamentsTab() {
  const [tournaments, setTournaments] = useState<Tournaments>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);

  // create form toggle
  const [showCreate, setShowCreate] = useState(false);

  // record result modal state
  const [resultMatch, setResultMatch] = useState<MatchView | null>(null);

  function refresh() {
    setTournaments(getTournaments());
    if (selectedId) {
      setDetail(getTournamentDetail(selectedId));
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      refresh();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  function handleCreateSuccess(newId: string) {
    setShowCreate(false);
    setSelectedId(newId);
    setTournaments(getTournaments());
  }

  function handleRecordResultSubmit(
    winnerId: string,
    scoreA?: number,
    scoreB?: number,
  ) {
    if (!selectedId || !resultMatch) return;
    recordMatchResult(
      selectedId,
      resultMatch.id,
      winnerId,
      scoreA,
      scoreB,
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
