"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function IntroPage() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  function enterSite() {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => {
      router.push("/home");
    }, 550);
  }

  useEffect(() => {
    function handleKey(event) {
      if ((event.key === "Enter" || event.key === " ") && document.activeElement?.tagName !== "BUTTON") {
        event.preventDefault();
        enterSite();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [leaving]);

  return (
    <main className={`intro-screen flex flex-col ${leaving ? "is-leaving" : ""}`}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-display text-[62vw] leading-none tracking-[-0.01em] text-ink/[0.025]">
          1863
        </div>
        <div className="absolute -left-40 top-[18%] h-[420px] w-[420px] rounded-full border border-ink/[0.07]" />
        <div className="absolute -right-28 bottom-[6%] h-[360px] w-[360px] rounded-full border border-gold/20" />
        <div className="absolute bottom-0 left-1/2 top-0 w-px bg-ink/[0.06]" />
        <span className="vertical label absolute left-10 top-1/2 hidden -translate-y-1/2 text-ink/65 lg:block">
          Est. 1863 · Paris
        </span>
        <span className="vertical label absolute right-10 top-1/2 hidden -translate-y-1/2 text-ink/65 lg:block">
          Le Salon des Refusés
        </span>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1240px] items-center justify-between px-6 py-6 lg:px-10">
        <div className="flex items-center gap-3">
          <img src="/desrefuses-mark.png" alt="desRefusés" className="h-8 w-auto lg:h-9" />
          <span className="label hidden text-ink/65 sm:inline">Salon des Refusés</span>
        </div>
        <span className="label text-ink/65">Paris · MDCCCLXIII</span>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center px-5 py-8">
        <div className="max-w-4xl text-center">
          <div className="intro-logo relative mx-auto mb-8 h-[148px] w-[148px] sm:h-[188px] sm:w-[188px]">
            <div className="absolute inset-0 rounded-full border border-ink/12" />
            <div className="absolute inset-3 rounded-full border border-gold/35" />
            <div className="absolute inset-4 rotate-slow rounded-full border border-dashed border-ink/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <img src="/desrefuses-mark.png" alt="Logo desRefusés" className="h-20 w-auto sm:h-28" />
            </div>
          </div>
          <div className="intro-rise intro-rise-1">
            <h1 className="font-display text-[41px] leading-[1.12] tracking-[-0.01em] sm:text-[59px] lg:text-[85px]">
              desRefusés
            </h1>
          </div>
          <div className="intro-rise intro-rise-2 mt-4">
            <p className="font-serif-italic text-[25px] leading-none text-wine sm:text-[33px] lg:text-[32px]">V-2.0</p>
          </div>
          <div className="intro-rise intro-rise-3 mt-8 flex items-center justify-center gap-4">
            <span className="wine-rule hidden sm:block" />
            <span className="label whitespace-nowrap text-ink/65">
              Galeri tanpa juri<span className="hidden sm:inline"> · Sejak 1863</span>
            </span>
            <span className="wine-rule hidden sm:block" />
          </div>
          <p className="intro-rise intro-rise-3 mx-auto mt-6 max-w-md text-[14px] leading-[1.7] text-ink/65 sm:text-[15px]">
            Karya yang pernah ditolak mendapat ruangnya. Tidak ada dewan juri, tidak ada antrean seleksi — hanya karya dan publiknya.
          </p>
          <button
            type="button"
            onClick={enterSite}
            className="intro-enter intro-rise intro-rise-4 group mt-9 inline-flex items-center gap-4"
            aria-label="Masuk ke galeri desRefusés"
          >
            <span className="intro-enter-circle flex h-14 w-14 items-center justify-center rounded-full border border-ink/25 sm:h-16 sm:w-16">
              <i className="fa-solid fa-arrow-down -rotate-90 text-[13px]" />
            </span>
            <span className="text-left">
              <span className="label block text-ink/65">Klik untuk masuk</span>
              <span className="mt-1 block font-display text-[19px]">Mulai menjelajah</span>
            </span>
          </button>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1240px] items-end justify-between gap-4 px-6 pb-6 lg:px-10">
        <span className="label text-ink/65">Tanpa dewan juri</span>
        <span className="label hidden text-right text-ink/65 sm:inline">Karya Anda, hak Anda untuk dilihat</span>
      </div>
    </main>
  );
}
