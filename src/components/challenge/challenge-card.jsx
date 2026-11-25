import Link from "next/link";
import StatusBadge from "@/components/ui/status-badge";

function formatDateId(value) {
  if (!value) return "—";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function ChallengeCard({ challenge, curator, submissions }) {
  const daysLeft = Math.max(0, Math.ceil((new Date(`${challenge.endDate}T23:59:59`) - new Date()) / 86400000));
  return (
    <Link href={`/challenges/${challenge.id}`} className="group flex h-full flex-col">
      <div className="challenge-media relative aspect-[4/5] overflow-hidden bg-ink">
        <img src={challenge.banner} alt={challenge.title} loading="lazy" className="art-img h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/65 via-transparent to-transparent" />
        <StatusBadge className="status-approved absolute left-4 top-4">Berlangsung</StatusBadge>
        <span className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 text-paper transition-transform duration-300 group-hover:translate-x-1">
          <i className="fa-solid fa-arrow-right text-[12px]" />
        </span>
      </div>
      <div className="flex flex-1 flex-col pt-5">
        <div className="flex items-center justify-between gap-3 text-[11px] font-label uppercase tracking-[0.18em] text-ink/65">
          <span>{curator ?? "Kurator"}</span>
          <span>{daysLeft > 0 ? `${daysLeft} hari lagi` : "Hari terakhir"}</span>
        </div>
        <h3 className="font-display mt-3 line-clamp-2 min-h-[4.1rem] text-[29px] leading-[1.12] tracking-[-0.01em] transition-colors group-hover:text-wine">
          {challenge.title}
        </h3>
        <p className="mt-2.5 line-clamp-2 min-h-[2.8rem] text-[14px] leading-relaxed text-ink/65">{challenge.description}</p>
        <div className="mt-auto flex items-center justify-between border-t hairline pt-3 text-[12px] font-label text-ink/65">
          <span>{submissions} karya</span>
          <span>{formatDateId(challenge.endDate)}</span>
        </div>
      </div>
    </Link>
  );
}
