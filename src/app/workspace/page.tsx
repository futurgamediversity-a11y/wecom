import Link from "next/link";
import { WComLogo } from "@/components/brand/wcom-logo";

export default function WorkspacePage() {
  return (
    <main className="min-h-screen bg-neutral-50 flex flex-col p-8">
      <header className="mb-8 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-3">
          <WComLogo size="sm" />
          <h1 className="text-2xl font-black text-[#A855F7]">Espace de Travail</h1>
        </div>
        <Link href="/seller-setup" className="text-sm font-semibold text-neutral-600 hover:text-[#A855F7] transition-colors">
          Changer d'espace
        </Link>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-card animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-2xl bg-[#A855F7]/10 text-[#A855F7]">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          </div>
          <h2 className="text-2xl font-black text-wcom-ink">Votre espace de travail est en cours de création</h2>
          <p className="mt-4 text-neutral-500 font-medium leading-relaxed max-w-lg mx-auto">
            Cet espace vous permettra de proposer vos services, de gérer vos réservations et d&apos;organiser vos missions. Bientôt disponible.
          </p>
          <button className="mt-8 rounded-xl bg-[#A855F7] px-8 py-3.5 font-bold text-white shadow-lg shadow-[#A855F7]/30 transition hover:-translate-y-0.5 hover:bg-[#9333EA]">
            Configurer mon profil pro
          </button>
        </div>
      </div>
    </main>
  );
}