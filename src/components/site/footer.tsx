import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto grid max-w-7xl gap-10 py-12 px-4 md:px-6 md:grid-cols-4">
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
          <h4 className="text-sm font-bold text-neutral-900">Acheter</h4>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600">
            <li><Link href="/shop" className="hover:text-wcom-orange transition">Boutique</Link></li>
            <li><Link href="/services" className="hover:text-wcom-orange transition">Services</Link></li>
            <li><Link href="/orders" className="hover:text-wcom-orange transition">Mes commandes</Link></li>
            <li><Link href="/favorites" className="hover:text-wcom-orange transition">Favoris</Link></li>
            <li><Link href="/livreur" className="hover:text-wcom-orange transition">Livraison</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold text-neutral-900">Vendre</h4>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600">
            <li><Link href="/seller-setup" className="hover:text-wcom-orange transition">Devenir vendeur</Link></li>
            <li><Link href="/workspace" className="hover:text-wcom-orange transition">Créer un espace de travail</Link></li>
            <li><Link href="/seller/dashboard" className="hover:text-wcom-orange transition">Tableau de bord Vendeur</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold text-neutral-900">Légal & Contact</h4>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600">
            <li><Link href="/legal/terms" className="hover:text-wcom-orange transition">Conditions générales</Link></li>
            <li><Link href="/legal/privacy" className="hover:text-wcom-orange transition">Politique de confidentialité</Link></li>
            <li><a href="mailto:contact@w-com.ci" className="hover:text-wcom-orange transition">Contact support</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-200 py-4 text-center text-xs text-neutral-500 px-4 md:px-6">
        © 2026 W-COM — Tous droits réservés.
      </div>
    </footer>
  );
}
