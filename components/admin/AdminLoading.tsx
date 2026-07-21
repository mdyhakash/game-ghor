export default function AdminLoading({
  label = "Loading…",
}: {
  label?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-line border-t-pink animate-spin" />
      <div className="text-[13px] text-text-dim font-semibold">{label}</div>
    </div>
  );
}
