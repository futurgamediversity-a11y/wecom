import Link from "next/link";
import { ArrowRight, ShoppingBag, Briefcase, Truck } from "lucide-react";
import { WComLogo } from "@/components/brand/wcom-logo";
import { Button } from "@/components/ui/button";

/**
 * Landing / welcome page — desktop adaptation of the dramatic Flutter
 * role_screen: diagonal split (white top + dark bottom), dotted patterns,
 * rotated W-COM lockup, two giant CTAs in orange and green.
 */
export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white">
      {/* Top-right corner: dark diagonal panel with orange dots */}
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

      {/* Background dots (green) on white area */}
      <div className="absolute inset-0 bg-dots-green opacity-100" />

      {/* Green diagonal line */}
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

      {/* Top nav (minimal — login/register only) */}
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-sm bg-wcom-orange text-white font-black">
            W
          </span>
          <span className="text-xl font-black tracking-wider text-white drop-shadow">
            W-COM
          </span>
        </div>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-sm px-4 py-2 text-sm font-bold text-white hover:bg-white/10"
          >
            Se connecter
          </Link>
          <Link href="/register">
            <Button variant="primary" size="sm">
              Créer un compte
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero content */}
      <section className="relative z-10 mx-auto grid max-w-7xl grid-cols-12 gap-8 px-8 pt-10">
        {/* PRODUITS & SERVICES (top-right, orange on dark) */}
        <Link
          href="/shop"
          className="group col-span-7 col-start-6 row-start-1 mt-6 block rounded-xl p-8 transition active:scale-[0.99]"
        >
          <div className="flex flex-col items-center text-center text-white">
            <ShoppingBag className="h-16 w-16 text-wcom-orange" strokeWidth={2.5} />
            <h2 className="mt-3 text-[3.5rem] font-black leading-none tracking-tight text-wcom-orange md:text-6xl">
              PRODUITS &<br />SERVICES
            </h2>
            <p className="mt-4 max-w-md text-lg font-semibold">
              Explorez le marché ivoirien et saisissez les meilleures opportunités.
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-wcom-orange transition group-hover:gap-3">
              Acheter maintenant <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>

        {/* BOUTIQUE & ESPACE DE TRAVAIL (bottom-left, green on white) */}
        <Link
          href="/role"
          className="group col-span-7 col-start-1 row-start-2 mt-32 block rounded-xl p-8 transition active:scale-[0.99]"
        >
          <div className="flex flex-col items-start text-left">
            <div className="grid h-16 w-16 place-items-center rounded-lg bg-wcom-green">
              <Briefcase className="h-9 w-9 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="mt-3 text-[3rem] font-black leading-none tracking-tight text-wcom-green md:text-5xl">
              BOUTIQUE &<br />ESPACE DE<br />TRAVAIL
            </h2>
            <p className="mt-4 max-w-md text-lg font-extrabold text-black">
              Lancez votre business, imposez votre marque et dominez les ventes.
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-wcom-green transition group-hover:gap-3">
              Vendre / créer un espace <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>
      </section>

      {/* Center rotated W-COM lockup */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <WComLogo size="lg" />
      </div>

      {/* Feature strip at very bottom */}
      <section className="relative z-10 mx-auto mt-10 grid max-w-7xl grid-cols-3 gap-6 px-8 pb-12">
        {[
          {
            icon: ShoppingBag,
            title: "Achat sécurisé",
            text: "Paiement local (Wave, Orange Money, MTN MoMo, Moov) ou par carte.",
          },
          {
            icon: Truck,
            title: "Livraison Abidjan",
            text: "Cocody, Marcory, Yopougon, Plateau, Treichville, Bingerville.",
          },
          {
            icon: Briefcase,
            title: "Outils pour vendeurs",
            text: "Boutique, statistiques, marketing, AI assistant intégré.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="rounded-lg border border-neutral-200 bg-white/90 p-5 backdrop-blur"
          >
            <Icon className="h-6 w-6 text-wcom-orange" />
            <h3 className="mt-3 text-base font-bold">{title}</h3>
            <p className="mt-1 text-sm text-neutral-600">{text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
