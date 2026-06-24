import Link from "next/link";
import { WComLogo } from "@/components/brand/wcom-logo";

export default function SellerDashboardPage() {
  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <WComLogo size="sm" />
          <h1 className="text-2xl font-black text-wcom-green">Tableau de bord Vendeur</h1>
        </div>
        <Link href="/role" className="text-sm font-semibold text-neutral-600 hover:text-wcom-green">
          Retour au choix du rôle
        </Link>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-card">
          <h2 className="text-lg font-bold text-neutral-800">Ventes du jour</h2>
          <p className="mt-2 text-3xl font-black text-wcom-green">0 XOF</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-card">
          <h2 className="text-lg font-bold text-neutral-800">Commandes en attente</h2>
          <p className="mt-2 text-3xl font-black text-wcom-orange">0</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-card">
          <h2 className="text-lg font-bold text-neutral-800">Articles en stock</h2>
          <p className="mt-2 text-3xl font-black">0</p>
        </div>
      </div>

      <div className="mt-12 rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-card">
        <h2 className="text-xl font-bold">Votre boutique est vide</h2>
        <p className="mt-2 text-neutral-600">Ajoutez votre premier produit pour commencer à vendre sur W-COM.</p>
        <button className="mt-6 rounded-md bg-wcom-green px-6 py-3 font-bold text-white shadow-lg hover:bg-green-700">
          Ajouter un produit
        </button>
      </div>
    </main>
  );
}