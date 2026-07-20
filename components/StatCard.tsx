export default function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="p-3.5 rounded-2xl bg-card border border-line">
      <div
        className={`font-display text-xl font-bold ${accent ?? "text-text"}`}
      >
        {value}
      </div>
      <div className="text-[11px] text-text-dim mt-0.5">{label}</div>
    </div>
  );
}
