import Link from "next/link";
import {
  ShoppingBag,
  Wrench,
  Store,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import { WComLogo } from "@/components/brand/wcom-logo";

/**
 * Post-login role-selection screen.
 * Port of lib/screens/role_screen.dart — the iconic split design with
 * "PRODUITS & SERVICES" (orange) at top-right on the dark slab and
 * "BOUTIQUE & ESPACE DE TRAVAIL" (green) at bottom-left on white.
 *
 * Tapping either side reveals two sub-choices (the bottom-sheet equivalent).
 */
export default function RolePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white">
      {/* Dark diagonal slab (top-right) */}
      <div
        className="absolute inset-0 -z-0"
        style={{
          clipPath:
            "polygon(100% 0%, 100% 100%, 90% 100%, 0% 5%, 0% 0%, 100% 0%)",
          background: "#121212",
        }}
      >
        <div className="absolute inset-0 bg-dots-orange opacity-90" />
      </div>

      <div className="absolute inset-0 bg-dots-green opacity-100" />

      {/* Diagonal green stroke */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <line
          x1="0"
          y1="5"
          x2="90"
          y2="100"
          stroke="#009639"
          strokeWidth="0.8"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Mini header */}
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-sm bg-wcom-orange text-white font-black">
            W
          </span>
          <span className="text-xl font-black tracking-wider text-white drop-shadow">
            W-COM
          </span>
        </div>
        <Link
          href="/profile"
          className="rounded-sm px-4 py-2 text-sm font-bold text-white hover:bg-white/10"
        >
          Mon profil
        </Link>
      </header>

      {/* Two columns of choices (instead of bottom sheets — desktop pattern) */}
      <section className="relative z-10 mx-auto grid max-w-7xl grid-cols-12 gap-8 px-8 pt-10">
        {/* ACHETER — top right, orange on dark */}
        <div className="col-span-7 col-start-6 row-start-1 mt-6 text-white">
          <div className="flex flex-col items-center text-center">
            <ShoppingBag className="h-16 w-16 text-wcom-orange" strokeWidth={2.5} />
            <h2 className="mt-3 text-5xl font-black leading-none tracking-tight text-wcom-orange md:text-6xl">
              PRODUITS &<br />SERVICES
            </h2>
            <p className="mt-3 max-w-md text-lg font-semibold">
              Trouvez exactement ce dont vous avez besoin — produits du quotidien
              ou services d&apos;experts.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-2xl space-y-4">
            <ChoiceCard
              href="/shop"
              icon={<ShoppingBag className="h-7 w-7" />}
              accent="#FF8200"
              title="Faire mes courses"
              subtitle="Achetez des produits physiques"
              dark
            />
            <ChoiceCard
              href="/services"
              icon={<Wrench className="h-7 w-7" />}
              accent="#3B82F6"
              title="Voir les services"
              subtitle="Réservez un pro certifié"
              dark
            />
          </div>
        </div>

        {/* VENDRE — bottom left, green on white */}
        <div className="col-span-7 col-start-1 row-start-2 mt-24">
          <div className="flex flex-col items-start text-left">
            <div className="grid h-16 w-16 place-items-center rounded-lg bg-wcom-green">
              <Briefcase className="h-9 w-9 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="mt-3 text-4xl font-black leading-none tracking-tight text-wcom-green md:text-5xl">
              BOUTIQUE &<br />ESPACE DE<br />TRAVAIL
            </h2>
            <p className="mt-3 max-w-md text-lg font-extrabold text-black">
              Choisissez votre espace de travail et pilotez votre croissance en
              temps réel.
            </p>
          </div>

          <div className="mt-8 max-w-2xl space-y-4">
            <ChoiceCard
              href="/seller/dashboard"
              icon={<Store className="h-7 w-7" />}
              accent="#009639"
              title="Gérer ma boutique"
              subtitle="Vendez vos articles et gérez vos stocks"
            />
            <ChoiceCard
              href="/workspace"
              icon={<Briefcase className="h-7 w-7" />}
              accent="#A855F7"
              title="Mon espace de travail"
              subtitle="Proposez vos services et organisez-vous"
              badge="NEW"
            />
          </div>
        </div>
      </section>

      {/* Center rotated lockup */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <WComLogo size="lg" />
      </div>
    </main>
  );
}

function ChoiceCard({
  href,
  icon,
  accent,
  title,
  subtitle,
  badge,
  dark,
}: {
  href: string;
  icon: React.ReactNode;
  accent: string;
  title: string;
  subtitle: string;
  badge?: string;
  dark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        "group block rounded-xl border p-5 transition hover:-translate-y-0.5 " +
        (dark
          ? "border-white/15 bg-white/5 backdrop-blur"
          : "border-neutral-200 bg-white shadow-card")
      }
      style={{ borderColor: dark ? undefined : `${accent}33` }}
    >
      <div className="flex items-center gap-4">
        <div
          className="grid h-14 w-14 place-items-center rounded-lg"
          style={{
            backgroundColor: `${accent}26`,
            color: accent,
            boxShadow: `0 8px 24px ${accent}40`,
          }}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3
              className={
                "text-lg font-black " + (dark ? "text-white" : "text-black")
              }
            >
              {title}
            </h3>
            {badge ? (
              <span
                className="rounded-sm px-2 py-0.5 text-[10px] font-black text-white"
                style={{ backgroundColor: "#FF8200" }}
              >
                {badge}
              </span>
            ) : null}
          </div>
          <p
            className={
              "text-sm " + (dark ? "text-white/60" : "text-neutral-500")
            }
          >
            {subtitle}
          </p>
        </div>
        <ArrowRight
          className={
            "h-4 w-4 " + (dark ? "text-white/40" : "text-neutral-400")
          }
        />
      </div>
    </Link>
  );
}
