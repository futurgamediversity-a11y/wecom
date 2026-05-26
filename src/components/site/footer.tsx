import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-sm bg-wcom-orange text-white font-black">
              W
            </span>
            <span className="text-lg font-black tracking-wider">W-COM</span>
          </div>
          <p className="mt-3 text-sm text-neutral-600">
            La plateforme ivoirienne pour acheter, vendre et bâtir votre activité.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-bold">Acheter</h4>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600">
            <li><Link href="/shop">Boutique</Link></li>
            <li><Link href="/orders">Mes commandes</Link></li>
            <li><Link href="/favorites">Favoris</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold">Vendre</h4>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600">
            <li><Link href="/role">Devenir vendeur</Link></li>
            <li><Link href="/role">Créer un espace de travail</Link></li>
            <li><Link href="/help">Centre d&apos;aide</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold">Légal</h4>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600">
            <li>Conditions générales</li>
            <li>Politique de confidentialité</li>
            <li>Contact support</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-200 py-4 text-center text-xs text-neutral-500">
        © 2026 W-COM — Tous droits réservés.
      </div>
    </footer>
  );
}
