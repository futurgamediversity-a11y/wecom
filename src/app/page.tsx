"use client";

import Link from "next/link";
import { useEffect, useState, type MouseEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";

const WORDS: [string, string][] = [
  ["acheter", "#FF8200"],
  ["vendre", "#009639"],
  ["livrer", "#FF8200"],
  ["travailler", "#009639"],
];
const COMMUNES = ["Cocody", "Marcory", "Yopougon", "Plateau", "Treichville", "Bingerville"];
const PAYMENTS = ["wave", "om", "momo", "moov", "card"];
const NAV = [
  { href: "/shop", label: "Boutique" },
  { href: "/seller-setup", label: "Vendre & Services" },
  { href: "/livreur", label: "Livraison" },
];

const ease = "cubic-bezier(.2,.8,.2,1)";
const rise = (delay: number) => ({ animation: `wcom-rise .7s ${delay}s ${ease} backwards` });

/**
 * Landing / welcome page — single-screen bento layout (no scroll).
 */
export default function HomePage() {
  const [i, setI] = useState(0);
  const [c, setC] = useState(0);
  const [spot, setSpot] = useState({ x: 30, y: 20 });

  useEffect(() => {
    const t1 = setInterval(() => setI((v) => (v + 1) % WORDS.length), 2400);
    const t2 = setInterval(() => setC((v) => (v + 1) % COMMUNES.length), 1800);
    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, []);

  const onHeroMove = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setSpot({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  const [word, wordColor] = WORDS[i];

  return (
    <div
      className="flex min-h-screen w-full flex-col gap-4 overflow-x-hidden bg-wcom-offwhite bg-dots-green p-4 md:grid md:h-screen md:grid-rows-[56px_minmax(0,1fr)] md:p-[18px] text-wcom-ink"
      style={{ backgroundImage: "radial-gradient(circle, rgba(0,150,57,.10) 1.5px, transparent 1.5px)" }}
    >
      {/* Header */}
      <header className="flex items-center justify-between gap-4" style={rise(0)}>
        <Link href="/" className="flex items-center gap-2.5">
          <span className="block h-11 w-11 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/app_icon.png"
              alt="W-COM"
              className="block h-full w-full object-cover"
              style={{ transform: "scale(1.4) translateY(3%)" }}
            />
          </span>
          <span className="text-[19px] font-black tracking-wider">
            <span className="text-wcom-orange">W</span>-COM
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 rounded-xl border border-neutral-200 bg-white p-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3.5 py-2 text-[13px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-wcom-ink"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden h-10 items-center rounded-[10px] px-4 text-sm font-bold transition-colors hover:bg-neutral-100 md:inline-flex"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="inline-flex h-10 items-center rounded-[10px] bg-wcom-ink px-[18px] text-sm font-bold text-white transition hover:-translate-y-px hover:bg-wcom-orange"
          >
            S'inscrire
          </Link>
        </div>
      </header>

      {/* Bento grid */}
      <main className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] md:grid-rows-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,.78fr)] pb-6 md:pb-0">
        {/* Hero */}
        <section
          onMouseMove={onHeroMove}
          className="relative flex min-h-[420px] flex-col overflow-hidden rounded-xl bg-wcom-dark text-white md:col-start-1 md:row-span-3 md:row-start-1"
          style={{ padding: "clamp(22px,3.6vh,40px)", ...rise(0.05) }}
        >
          <div className="pointer-events-none absolute inset-0 bg-dots-orange" style={{ backgroundImage: "radial-gradient(circle, rgba(255,130,0,.16) 1.5px, transparent 1.5px)" }} />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: `radial-gradient(520px circle at ${spot.x}% ${spot.y}%, rgba(255,130,0,.22), transparent 60%)` }}
          />
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <line x1="0" y1="62" x2="100" y2="104" stroke="#009639" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </svg>

          <div className="relative flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[.07] py-1.5 pl-2 pr-3 text-xs font-semibold text-white/85">
            <span className="h-2 w-2 rounded-full bg-wcom-green" style={{ animation: "wcom-pulse 2s infinite" }} />
            Marketplace ivoirien · Abidjan
          </div>

          <h1
            className="relative max-w-[12ch] font-black leading-[.98] tracking-[-.035em]"
            style={{ margin: "clamp(16px,3vh,32px) 0 0", fontSize: "clamp(34px, calc(3.2vw + 2.4vh), 80px)", textWrap: "balance" }}
          >
            Le marché ivoirien pour{" "}
            <span key={word} className="inline-block" style={{ color: wordColor, animation: `wcom-word-in .6s ${ease}` }}>
              {word}.
            </span>
          </h1>

          <p
            className="relative max-w-[40ch] font-medium leading-relaxed text-white/80"
            style={{ margin: "clamp(12px,2vh,20px) 0 0", fontSize: "clamp(14px,1.8vh,17px)" }}
          >
            Explorez le marché ivoirien et saisissez les meilleures opportunités — ou lancez votre boutique en quelques minutes.
          </p>

          <Link
            href="/shop"
            className="relative flex h-[52px] max-w-[460px] w-full items-center gap-2.5 rounded-[14px] bg-white pl-4 pr-1.5 text-sm font-medium text-neutral-500 shadow-[0_10px_30px_rgba(0,0,0,.25)] transition hover:-translate-y-px hover:shadow-[0_0_0_4px_rgba(255,130,0,.35),0_10px_30px_rgba(0,0,0,.25)]"
            style={{ marginTop: "clamp(16px,3vh,28px)" }}
          >
            <Search className="h-[18px] w-[18px] shrink-0" />
            <span className="flex-1 truncate">Rechercher un produit...</span>
            <span className="inline-flex h-10 shrink-0 items-center rounded-[10px] bg-wcom-orange px-4 text-[13px] font-extrabold text-white">
              Explorer
            </span>
          </Link>

          <div className="relative mt-auto pt-6 flex items-end justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <Link
                href="/shop"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-wcom-orange px-[18px] text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:shadow-glow"
              >
                Acheter <ArrowRight className="h-4 w-4 hidden md:block" strokeWidth={2.5} />
              </Link>
              <Link
                href="/seller-setup"
                className="inline-flex h-11 items-center rounded-xl border border-white/20 px-[18px] text-sm font-bold text-white transition hover:border-wcom-green hover:bg-wcom-green/20"
              >
                Vendre
              </Link>
            </div>

            <div
              className="relative shrink-0 hidden md:block mb-1.5 mr-1.5"
              style={{ width: "clamp(96px,14vh,150px)", height: "clamp(96px,14vh,150px)", animation: "wcom-floaty 6s ease-in-out infinite" }}
            >
              <div className="absolute inset-0 rounded-[22px] bg-wcom-green" style={{ transform: "translate(10px,12px)" }} />
              <div className="absolute inset-0 rounded-[22px] bg-wcom-orange" style={{ transform: "translate(5px,6px)" }} />
              <div className="absolute inset-0 overflow-hidden rounded-[22px] border-[3px] border-wcom-orange bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/app_icon.png" alt="" className="block h-full w-full object-cover" style={{ transform: "scale(1.18)" }} />
              </div>
            </div>
          </div>
        </section>

        {/* Produits & Services */}
        <Link
          href="/shop"
          className="relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-xl bg-wcom-orange text-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-18px_rgba(255,130,0,.7)] md:col-span-2 md:col-start-2 md:row-start-1"
          style={{ padding: "clamp(18px,3vh,30px)", ...rise(0.12) }}
        >
          <ShoppingBag className="absolute -bottom-[18%] -right-[4%] h-auto w-[52%] max-w-[200px] -rotate-12 opacity-[.16]" strokeWidth={1.5} />
          <div className="relative flex items-start justify-between">
            <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-white/20">
              <ShoppingBag className="h-6 w-6" strokeWidth={2.5} />
            </span>
            <span className="grid h-11 w-11 place-items-center rounded-full bg-white">
              <ArrowUpRight className="h-5 w-5 text-wcom-orange" strokeWidth={2.5} />
            </span>
          </div>
          <div className="relative mt-8 md:mt-0">
            <h2 className="font-black leading-[.95] tracking-[-.03em]" style={{ fontSize: "clamp(28px, calc(2vw + 2vh), 56px)" }}>
              Articles et Services
            </h2>
            <p className="mt-2.5 max-w-[38ch] font-semibold leading-snug text-wcom-dark" style={{ fontSize: "clamp(13px,1.7vh,16px)" }}>
              Explorez le marché ivoirien et saisissez les meilleures opportunités.
            </p>
          </div>
        </Link>

        {/* Boutique & Espace de travail */}
        <Link
          href="/seller-setup"
          className="relative flex min-h-[200px] flex-col justify-between overflow-hidden rounded-xl bg-wcom-green text-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-18px_rgba(0,150,57,.7)] md:col-start-2 md:row-start-2"
          style={{ padding: "clamp(18px,2.8vh,26px)", ...rise(0.2) }}
        >
          <div className="flex items-start justify-between">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/[.18]">
              <Briefcase className="h-[22px] w-[22px]" strokeWidth={2.5} />
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white">
              <ArrowUpRight className="h-4 w-4 text-wcom-green" strokeWidth={2.5} />
            </span>
          </div>
          <div className="mt-8 md:mt-0">
            <h3 className="font-black leading-none tracking-[-.025em]" style={{ fontSize: "clamp(20px, calc(1.1vw + 1.4vh), 32px)" }}>
              Boutique &amp; Espace de travail
            </h3>
            <p className="mt-2 font-bold leading-snug" style={{ fontSize: "clamp(12px,1.5vh,14px)" }}>
              Lancez votre business et imposez votre marque.
            </p>
          </div>
        </Link>

        {/* Livraison */}
        <Link
          href="/livreur"
          className="relative flex min-h-[200px] flex-col justify-between overflow-hidden rounded-xl bg-wcom-surface text-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-18px_rgba(9,10,15,.6)] md:col-start-3 md:row-start-2"
          style={{ padding: "clamp(18px,2.8vh,26px)", ...rise(0.28) }}
        >
          <div className="flex items-center justify-between">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-wcom-orange/[.14]">
              <Truck className="h-[22px] w-[22px] text-wcom-orange" strokeWidth={2.2} />
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/70">
              <span className="h-[7px] w-[7px] rounded-full bg-wcom-green" style={{ animation: "wcom-pulse 2s infinite" }} />
              En route
            </span>
          </div>
          <div className="mt-8 md:mt-0">
            <div
              className="mb-3 h-[3px] rounded-[3px] opacity-80"
              style={{
                backgroundImage: "linear-gradient(90deg,#FF8200 50%,transparent 50%)",
                backgroundSize: "20px 3px",
                animation: "wcom-road 1s linear infinite",
              }}
            />
            <h3 className="font-black leading-none tracking-[-.025em]" style={{ fontSize: "clamp(20px, calc(1.1vw + 1.4vh), 32px)" }}>
              Livraison Abidjan
            </h3>
            <p className="mt-2 font-semibold text-white/70" style={{ fontSize: "clamp(12px,1.5vh,14px)" }}>
              Vers{" "}
              <span key={c} className="inline-block font-extrabold text-white" style={{ animation: `wcom-word-in .5s ${ease}` }}>
                {COMMUNES[c]}
              </span>
            </p>
          </div>
        </Link>

        {/* Achat sécurisé */}
        <div
          className="relative flex min-h-[140px] flex-col justify-between overflow-hidden rounded-xl border border-neutral-200 bg-white md:col-start-2 md:row-start-3"
          style={{ padding: "clamp(14px,2.2vh,22px) 0", ...rise(0.36) }}
        >
          <div className="flex items-center gap-2.5" style={{ padding: "0 clamp(16px,2.2vh,22px)" }}>
            <ShieldCheck className="h-5 w-5 text-wcom-green" strokeWidth={2.2} />
            <span className="text-[15px] font-extrabold">Achat sécurisé</span>
          </div>
          <div
            className="relative overflow-hidden mt-6 md:mt-0"
            style={{
              WebkitMaskImage: "linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)",
              maskImage: "linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)",
            }}
          >
            <div className="flex w-max gap-2.5" style={{ animation: "wcom-marquee 16s linear infinite" }}>
              {[...PAYMENTS, ...PAYMENTS].map((p, k) => (
                <span key={k} className="grid h-10 w-16 shrink-0 place-items-center overflow-hidden rounded-[10px] border border-neutral-200 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/images/payments/${p}.png`} alt={p} className="max-h-7 max-w-12 object-contain" />
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Outils pour vendeurs */}
        <Link
          href="/seller-setup"
          className="relative flex min-h-[140px] flex-col justify-between overflow-hidden rounded-xl border border-neutral-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-wcom-orange md:col-start-3 md:row-start-3"
          style={{ padding: "clamp(14px,2.2vh,22px)", ...rise(0.44) }}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-wcom-orange" strokeWidth={2.2} />
              <span className="text-[15px] font-extrabold">Outils pour vendeurs</span>
            </span>
            <ArrowUpRight className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </div>
          <p className="mt-4 md:mt-0 font-medium leading-snug text-neutral-600" style={{ fontSize: "clamp(12px,1.5vh,14px)" }}>
            Boutique, statistiques, marketing et AI assistant intégré.
          </p>
        </Link>
      </main>
      
      <footer className="border-t border-neutral-200 py-8 bg-wcom-offwhite relative z-10">
        <div className="mx-auto flex max-w-[1300px] flex-col items-center justify-between gap-4 px-[5vw] md:flex-row">
          <p className="text-sm font-semibold text-neutral-500">
            &copy; 2026 Futur Game Diversity (FGD). Tous droits réservés.
          </p>
          <div className="flex gap-6 text-sm font-bold text-neutral-600">
            <Link href="/legal/terms" className="hover:text-wcom-orange transition">CGU / CGV</Link>
            <Link href="/legal/privacy" className="hover:text-wcom-orange transition">Confidentialité</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
