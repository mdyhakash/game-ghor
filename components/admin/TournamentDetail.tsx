import { useState } from "react";
import { api, getErrorMessage } from "@/lib/api-client";
import type { Tournament } from "@/lib/data";
import BracketView, {
  type MatchView,
} from "@/components/admin/bracket/BracketView";
import ParticipantForm from "./ParticipantForm";
import { useToast } from "@/components/Toast";

type Detail = {
  tournament: Tournament;
  participants: {
    id: string;
    tournamentId: string;
    name: string;
    phone: string | null;
  }[];
  rounds: { round: number; matches: MatchView[] }[];
};

const STATUS_STYLE: Record<string, string> = {
  UPCOMING: "text-gold bg-[var(--gold-dim)] border-gold",
  ONGOING: "text-lime bg-[var(--lime-dim)] border-lime",
  COMPLETED: "text-text-dim bg-bg-soft border-line",
};

const MAX_PLAYERS_OPTIONS = [4, 8, 16, 32];

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
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState(detail.tournament.name);
  const [editGameTitle, setEditGameTitle] = useState(
    detail.tournament.gameTitle,
  );
  const [editMaxPlayers, setEditMaxPlayers] = useState(
    detail.tournament.maxPlayers,
  );
  const [editEntryFee, setEditEntryFee] = useState(detail.tournament.entryFee);
  const [editPrizePool, setEditPrizePool] = useState(
    detail.tournament.prizePool,
  );
  const [editStartDate, setEditStartDate] = useState(
    new Date(detail.tournament.startDate).toISOString().slice(0, 10),
  );
  const [editDescription, setEditDescription] = useState(
    detail.tournament.description,
  );
  const { showToast, confirmToast } = useToast();

  async function handleGenerateFixture() {
    setFixtureError(null);
    try {
      await api.post(`/admin/tournaments/${detail.tournament.id}/generate`);
      onRefresh();
    } catch (err) {
      setFixtureError(getErrorMessage(err));
    }
  }

  function startEditing() {
    setEditName(detail.tournament.name);
    setEditGameTitle(detail.tournament.gameTitle);
    setEditMaxPlayers(detail.tournament.maxPlayers);
    setEditEntryFee(detail.tournament.entryFee);
    setEditPrizePool(detail.tournament.prizePool);
    setEditStartDate(
      new Date(detail.tournament.startDate).toISOString().slice(0, 10),
    );
    setEditDescription(detail.tournament.description);
    setEditError(null);
    setEditing(true);
  }

  async function handleSaveEdit() {
    setSaving(true);
    setEditError(null);
    try {
      await api.patch(`/admin/tournaments/${detail.tournament.id}`, {
        name: editName,
        gameTitle: editGameTitle,
        maxPlayers: editMaxPlayers,
        entryFee: editEntryFee,
        prizePool: editPrizePool,
        startDate: editStartDate,
        description: editDescription,
      });
      setEditing(false);
      onRefresh();
    } catch (err) {
      setEditError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const ok = await confirmToast(
      `Delete "${detail.tournament.name}"? This removes all its players and matches too.`,
      { confirmLabel: "Delete" },
    );
    if (!ok) return;
    try {
      await api.delete(`/admin/tournaments/${detail.tournament.id}`);
      showToast("Tournament deleted", "success");
      onRefresh();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    }
  }

  return (
    <div className="bg-card border border-line rounded-2xl p-4">
      {editing ? (
        <div className="flex flex-col gap-3 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Tournament name">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px] focus:outline-none focus:border-pink"
              />
            </Field>
            <Field label="Game">
              <input
                value={editGameTitle}
                onChange={(e) => setEditGameTitle(e.target.value)}
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
                    onClick={() => setEditMaxPlayers(n)}
                    disabled={detail.tournament.status !== "UPCOMING"}
                    className={`flex-1 py-2 rounded-lg text-[12.5px] font-semibold border disabled:opacity-40 ${
                      editMaxPlayers === n
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
                value={editEntryFee}
                onChange={(e) => setEditEntryFee(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px] focus:outline-none focus:border-pink"
              />
            </Field>
            <Field label="Start date">
              <input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px] focus:outline-none focus:border-pink"
              />
            </Field>
          </div>
          <Field label="Prize pool">
            <input
              value={editPrizePool}
              onChange={(e) => setEditPrizePool(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px] focus:outline-none focus:border-pink"
            />
          </Field>
          <Field label="Description">
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px] focus:outline-none focus:border-pink resize-none"
            />
          </Field>

          {editError && (
            <div className="px-3.5 py-2.5 rounded-[10px] bg-[#ff2e9322] text-pink text-[12.5px] font-semibold">
              {editError}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className="px-4 py-2 rounded-lg font-display font-bold text-[13px] tracking-wide text-white"
              style={{
                background:
                  "linear-gradient(90deg, var(--pink), var(--purple))",
              }}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 rounded-lg font-semibold text-[13px] text-text-dim bg-bg-soft border border-line"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
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
          <div className="text-xs text-text-dim mb-3">
            {detail.tournament.gameTitle} ·{" "}
            {new Date(detail.tournament.startDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={startEditing}
              className="text-[11.5px] font-semibold text-text-dim bg-bg-soft border border-line px-3 py-1.5 rounded-full"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="text-[11.5px] font-semibold text-pink bg-[#ff2e9322] border border-pink px-3 py-1.5 rounded-full"
            >
              Delete
            </button>
          </div>
        </>
      )}

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
