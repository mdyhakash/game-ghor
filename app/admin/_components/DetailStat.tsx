export default function DetailStat({
  label,
  value,
  accent,
  small,
}: {
  label: string;
  value: string;
  accent?: string;
  small?: boolean;
}) {
  return (
    <div className="p-3 rounded-xl bg-bg-soft border border-line">
      <div
        className={`font-bold ${small ? "text-[11px] break-all" : "text-[15px]"} ${accent ?? "text-text"}`}
      >
        {value}
      </div>
      <div className="text-[10.5px] text-text-dim mt-0.5">{label}</div>
    </div>
  );
}
