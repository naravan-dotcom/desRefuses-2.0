export const statusLabels = {
  active: "Aktif",
  upcoming: "Mendatang",
  ended: "Selesai",
};

export const statusClasses = {
  active: "status-live",
  upcoming: "status-upcoming",
  ended: "status-ended",
};

export function getChallengeStatus(challenge, today) {
  const current = today || new Date().toISOString().slice(0, 10);
  if (!challenge?.startDate || !challenge?.endDate) return "ended";
  if (current < challenge.startDate) return "upcoming";
  if (current > challenge.endDate) return "ended";
  return "active";
}

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function nextDateInput(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
