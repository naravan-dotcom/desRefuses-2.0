import Link from "next/link";

export default function IntroPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-ink">
      <img
        src="/desrefuses-mark.png"
        alt="desRefusés"
        className="h-20 w-20 object-contain"
      />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">desRefusés</h1>
      <Link
        href="/home"
        className="mt-8 bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-brand"
      >
        Masuk
      </Link>
    </main>
  );
}
