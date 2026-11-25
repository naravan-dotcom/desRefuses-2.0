import Link from "next/link";

export default function NotFoundState({ icon, title, href, linkLabel }) {
  return (
    <main className="page-enter px-5 py-16 lg:px-10">
      <div className="mx-auto max-w-3xl border border-dashed border-ink/20 p-10 text-center">
        <i className={`${icon} text-2xl text-ink/40`} />
        <h1 className="font-display mt-4 text-[28px]">{title}</h1>
        <Link href={href} className="btn btn-outline btn-sm mt-5">{linkLabel}</Link>
      </div>
    </main>
  );
}
