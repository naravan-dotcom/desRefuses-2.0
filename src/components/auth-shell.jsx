import Link from "next/link";


const roleNotes = [
  ["01", "text-acid", "Member", "Unggah, berinteraksi, ikut challenge."],
  ["02", "text-paper/60", "Curator", "Ajukan akun, tunggu verifikasi admin."],
  ["03", "text-paper/70", "Admin", "Verifikasi, moderasi, kategori."],
];

export default function AuthShell({ mode, children }) {
  const isLogin = mode === "login";
  const isRegister = mode === "register";

  return (
    <main className="page-enter mx-auto max-w-[1240px] px-5 py-8 lg:px-10 lg:py-14">
      <div className="grid items-stretch gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="order-1 flex flex-col lg:col-span-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/desrefuses-mark.png" alt="desRefusés" className="h-9 w-auto" />
              <span className="font-display text-[21px] tracking-[-0.01em]">desRefusés</span>
            </div>
            <Link href="/home" className="btn btn-outline btn-sm">Keluar</Link>
          </div>

          <div className="mt-10 flex w-fit items-center gap-8 border-b hairline">
            <Link
              href="/login"
              className={`-mb-px border-b pb-3 font-label text-[12px] uppercase tracking-normal ${isLogin ? "border-wine text-ink" : "border-transparent text-ink/65 hover:text-ink"
                }`}
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className={`-mb-px border-b pb-3 font-label text-[12px] uppercase tracking-normal ${isRegister ? "border-wine text-ink" : "border-transparent text-ink/65 hover:text-ink"
                }`}
            >
              Daftar
            </Link>
          </div>

          <div className="mt-8 w-full">{children}</div>
        </div>

        <div className="relative order-2 min-h-[460px] overflow-hidden bg-ink text-paper lg:col-span-7 lg:min-h-[760px]">
          <img src="/uploads/art/art1.jpg" alt="Galeri desRefusés" className="absolute inset-0 h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/15" />
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{ backgroundImage: "radial-gradient(#fff .7px, transparent .7px)", backgroundSize: "22px 22px" }}
          />
          <div className="relative z-10 flex h-full flex-col justify-between px-7 pb-7 pt-24 lg:px-12 lg:pb-12 lg:pt-28">
            <div className="label flex items-center justify-between text-paper/70">
              <span>Paris — 1863</span>
              <span>Salon des Refusés</span>
            </div>
            <div className="py-12">
              <p className="font-serif-italic max-w-md text-[23px] leading-[1.15] text-paper/90 lg:text-[30px]">
                Karya yang ditolak tidak kehilangan hak untuk dilihat.
              </p>
              <div className="font-display mt-7 text-[62px] leading-[1.12] tracking-[-0.01em] lg:text-[89px]">
                1863<span className="text-acid">.</span>
              </div>
              <p className="mt-6 max-w-sm text-[13px] leading-[1.7] text-paper/70">
                Galeri utama tanpa seleksi juri. Kurator hanya mengelola tantangan sukarela, bukan gerbang karya.
              </p>
            </div>
            <div>
              {roleNotes.map(([num, color, title, text]) => (
                <div key={num} className="flex items-start justify-between gap-6 border-t border-paper/15 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`label ${color}`}>{num}</span>
                    <span className="text-[13px] font-semibold">{title}</span>
                  </div>
                  <span className="font-label max-w-[190px] text-right text-[12px] uppercase leading-relaxed tracking-normal text-paper/70">
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
