export function formatCountdown(ms: number) {
  if (ms <= 0) return "Time's up";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function formatDate(date: Date | string) {
  const d = date instanceof Date ? date : new Date(date);

  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
export function formatMemberNo(memberNo: number) {
  return `M-${String(memberNo).padStart(4, "0")}`;
}
