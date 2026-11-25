import Link from "next/link";

export default function SectionHeaderLink({ label, title, href, linkLabel }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="label text-ink/60">{label}</p>
        <h2 className="font-display mt-2 text-2xl leading-none">{title}</h2>
      </div>
      <Link href={href} className="label text-wine hover:text-ink">
        {linkLabel} <i className="fa-solid fa-arrow-right ml-1 text-[10px]" />
      </Link>
    </div>
  );
}
