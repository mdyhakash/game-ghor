import { useState } from "react";
import type { MatchView } from "@/components/BracketView";

interface RecordResultModalProps {
  match: MatchView;
  onClose: () => void;
  onSubmit: (winnerId: string, scoreA?: number, scoreB?: number) => void;
}

export default function RecordResultModal({
  match,
  onClose,
  onSubmit,
}: RecordResultModalProps) {
  const [resultWinnerId, setResultWinnerId] = useState<string | null>(null);
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");

  function handleSubmit() {
    if (!resultWinnerId) return;
    onSubmit(
      resultWinnerId,
      scoreA ? Number(scoreA) : undefined,
      scoreB ? Number(scoreB) : undefined,
    );
  }

  return (
    <div
      className="fixed inset-0 z-20 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-line rounded-2xl w-full max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-display text-lg font-bold mb-4">Record result</div>

        <div className="flex flex-col gap-2 mb-4">
          {[
            {
              id: match.participantAId,
              name: match.participantAName,
              score: scoreA,
              setScore: setScoreA,
            },
            {
              id: match.participantBId,
              name: match.participantBName,
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
          onClick={handleSubmit}
          disabled={!resultWinnerId}
          className="w-full py-3 rounded-xl font-display font-bold text-[13.5px] text-white disabled:opacity-40"
          style={{
            background: "linear-gradient(90deg, var(--pink), var(--purple))",
          }}
        >
          Save result
        </button>
      </div>
    </div>
  );
}
