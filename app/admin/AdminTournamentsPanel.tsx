"use client";

import { useEffect, useState } from "react";
import BracketView, { type MatchView } from "@/components/BracketView";
import {
  getTournaments,
  getTournamentDetail,
  createTournament,
  addParticipant,
  removeParticipant,
  generateFixture,
  recordMatchResult,
} from "@/lib/store";

type Tournaments = ReturnType<typeof getTournaments>;
type Detail = NonNullable<ReturnType<typeof getTournamentDetail>>;

const MAX_PLAYERS_OPTIONS = [4, 8, 16, 32];

const STATUS_STYLE: Record<string, string> = {
  UPCOMING: "text-gold bg-[var(--gold-dim)] border-gold",
  ONGOING: "text-lime bg-[var(--lime-dim)] border-lime",
  COMPLETED: "text-text-dim bg-bg-soft border-line",
};

export default function AdminTournamentsPanel() {
  const [tournaments, setTournaments] = useState<Tournaments>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);

  // create form
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [gameTitle, setGameTitle] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [entryFee, setEntryFee] = useState(0);
  const [prizePool, setPrizePool] = useState("");
  const [startDate, setStartDate] = useState("");
  const [description, setDescription] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  // add participant form
  const [playerName, setPlayerName] = useState("");
  const [playerPhone, setPlayerPhone] = useState("");
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [fixtureError, setFixtureError] = useState<string | null>(null);

  // record result modal
  const [resultMatch, setResultMatch] = useState<MatchView | null>(null);
  const [resultWinnerId, setResultWinnerId] = useState<string | null>(null);
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");

  function refresh() {
    setTournaments(getTournaments());
    if (selectedId) setDetail(getTournamentDetail(selectedId));
  }

  useEffect(() => {
    queueMicrotask(() => {
      refresh();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openTournament(id: string) {
    setSelectedId(id);
    setDetail(getTournamentDetail(id));
    setPlayerError(null);
    setFixtureError(null);
  }

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
    setShowCreate(false);
    setTournaments(getTournaments());
    openTournament(result.tournament.id);
  }

  function handleAddPlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setPlayerError(null);
    const result = addParticipant(selectedId, playerName, playerPhone);
    if ("error" in result) {
      setPlayerError(result.error);
      return;
    }
    setPlayerName("");
    setPlayerPhone("");
    refresh();
  }

  function handleRemovePlayer(participantId: string) {
    if (!selectedId) return;
    removeParticipant(selectedId, participantId);
    refresh();
  }

  function handleGenerateFixture() {
    if (!selectedId) return;
    setFixtureError(null);
    const result = generateFixture(selectedId);
    if ("error" in result) {
      setFixtureError(result.error);
      return;
    }
    refresh();
  }

  function openResultModal(match: MatchView) {
    setResultMatch(match);
    setResultWinnerId(null);
    setScoreA("");
    setScoreB("");
  }

  function submitResult() {
    if (!selectedId || !resultMatch || !resultWinnerId) return;
    recordMatchResult(
      selectedId,
      resultMatch.id,
      resultWinnerId,
      scoreA ? Number(scoreA) : undefined,
      scoreB ? Number(scoreB) : undefined,
    );
    setResultMatch(null);
    refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between pb-3">
        <div className="text-[12px] tracking-wider text-text-dim uppercase font-semibold">
          Tournaments
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="text-[11.5px] font-bold text-white px-3 py-1.5 rounded-full whitespace-nowrap"
          style={{
            background: "linear-gradient(90deg, var(--pink), var(--purple))",
          }}
        >
          {showCreate ? "Cancel" : "+ New tournament"}
        </button>
      </div>

      {showCreate && (
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
                        ? "border-pink bg-[var(--pink-dim)] text-pink"
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
      )}

      {/* tournament list */}
      {tournaments.length === 0 ? (
        <div className="text-center py-10 text-text-dim text-[13.5px]">
          No tournaments yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 mb-6">
          {tournaments.map((t) => (
            <button
              key={t.id}
              onClick={() => openTournament(t.id)}
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

      {/* selected tournament management */}
      {detail && (
        <div className="bg-card border border-line rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
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

          {detail.tournament.status === "UPCOMING" && (
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
            {detail.participants.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1.5 bg-bg-soft border border-line rounded-full pl-3 pr-1.5 py-1 text-[12.5px]"
              >
                {p.name}
                {detail.tournament.status === "UPCOMING" && (
                  <button
                    onClick={() => handleRemovePlayer(p.id)}
                    className="text-text-dim hover:text-pink text-sm leading-none px-1"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
            {detail.participants.length === 0 && (
              <span className="text-[12.5px] text-text-dim">
                No players yet.
              </span>
            )}
          </div>

          {detail.tournament.status === "UPCOMING" && (
            <button
              onClick={handleGenerateFixture}
              disabled={detail.participants.length < 2}
              className="w-full py-3 rounded-xl font-display font-bold text-[13.5px] tracking-wide text-white disabled:opacity-40"
              style={{
                background:
                  "linear-gradient(90deg, var(--pink), var(--purple))",
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
              <BracketView
                rounds={detail.rounds}
                onRecordResult={openResultModal}
              />
            </div>
          )}
        </div>
      )}

      {/* record result modal */}
      {resultMatch && (
        <div
          className="fixed inset-0 z-20 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setResultMatch(null)}
        >
          <div
            className="bg-card border border-line rounded-2xl w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-display text-lg font-bold mb-4">
              Record result
            </div>

            <div className="flex flex-col gap-2 mb-4">
              {[
                {
                  id: resultMatch.participantAId,
                  name: resultMatch.participantAName,
                  score: scoreA,
                  setScore: setScoreA,
                },
                {
                  id: resultMatch.participantBId,
                  name: resultMatch.participantBName,
                  score: scoreB,
                  setScore: setScoreB,
                },
              ].map(
                (side) =>
                  side.id && (
                    <button
                      key={side.id}
                      onClick={() => setResultWinnerId(side.id)}
                      className={`flex items-center justify-between px-3.5 py-3 rounded-xl border text-[13.5px] font-semibold ${
                        resultWinnerId === side.id
                          ? "border-lime bg-[var(--lime-dim)] text-lime"
                          : "border-line bg-bg-soft text-text"
                      }`}
                    >
                      <span>{side.name}</span>
                      {resultWinnerId === side.id && (
                        <span className="text-[11px]">WINNER</span>
                      )}
                    </button>
                  ),
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <input
                type="number"
                placeholder="Score A (optional)"
                value={scoreA}
                onChange={(e) => setScoreA(e.target.value)}
                className="px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px] focus:outline-none focus:border-pink"
              />
              <input
                type="number"
                placeholder="Score B (optional)"
                value={scoreB}
                onChange={(e) => setScoreB(e.target.value)}
                className="px-3 py-2 rounded-lg border border-line bg-bg-soft text-text text-[13px] focus:outline-none focus:border-pink"
              />
            </div>

            <button
              onClick={submitResult}
              disabled={!resultWinnerId}
              className="w-full py-3 rounded-xl font-display font-bold text-[13.5px] text-white disabled:opacity-40"
              style={{
                background:
                  "linear-gradient(90deg, var(--pink), var(--purple))",
              }}
            >
              Save result
            </button>
          </div>
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
