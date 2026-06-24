import Link from "next/link";
import { WComLogo } from "@/components/brand/wcom-logo";

export default function WorkspacePage() {
  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <WComLogo size="sm" />
          <h1 className="text-2xl font-black text-purple-600">Espace de Travail</h1>
        </div>
        <Link href="/role" className="text-sm font-semibold text-neutral-600 hover:text-purple-600">
          Retour au choix du rôle
        </Link>
      </header>

      <div className="mt-12 rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-card">
        <h2 className="text-xl font-bold">Votre espace de travail est en cours de création</h2>
        <p className="mt-2 text-neutral-600">Cet espace vous permettra de proposer vos services et d&apos;organiser vos missions.</p>
        <button className="mt-6 rounded-md bg-purple-600 px-6 py-3 font-bold text-white shadow-lg hover:bg-purple-700">
          Configurer mon profil pro
        </button>
      </div>
    </main>
  );
}