import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 bg-ink text-paper">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:px-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">

            <span className="font-semibold">desRefusés</span>
            <span className="border border-paper/25 px-1.5 py-0.5 text-[10px] text-paper/60">
              2.0
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper/60">
            Galeri digital tanpa dewan juri. Karya tampil langsung, publik yang
            memberi apresiasi.
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-paper/40">
            Jelajahi
          </p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-paper/65">
            <Link href="/gallery" className="hover:text-paper">
              Galeri publik
            </Link>
            <Link href="/challenges" className="hover:text-paper">
              Tantangan
            </Link>
            <Link href="/philosophy" className="hover:text-paper">
              Filosofi &amp; peran
            </Link>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-paper/40">
            Akun
          </p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-paper/65">
            <Link href="/login" className="hover:text-paper">
              Masuk
            </Link>
            <Link href="/register" className="hover:text-paper">
              Daftar
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-paper/15">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-2 px-6 py-5 text-[10px] uppercase tracking-[0.12em] text-paper/40 sm:flex-row sm:px-10">
          <span>© 2026 desRefusés 2.0</span>
          <span>Prototype Test</span>
        </div>
      </div>
    </footer>
  );
}
