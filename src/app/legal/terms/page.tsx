import { WComLogo } from "@/components/brand/wcom-logo";
import Link from "next/link";

export const metadata = {
  title: "CGU / CGV | W-COM",
  description: "Conditions Générales d'Utilisation et de Vente de W-COM",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-neutral-50 selection:bg-wcom-green/20">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/">
            <WComLogo size="sm" />
          </Link>
          <nav className="flex gap-6 text-sm font-bold text-neutral-500">
            <Link href="/" className="hover:text-wcom-green transition">Accueil</Link>
            <Link href="/legal/privacy" className="hover:text-wcom-green transition">Confidentialité</Link>
          </nav>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-6 py-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="rounded-3xl bg-white p-8 md:p-16 shadow-sm border border-neutral-200">
          <div className="mb-12 border-b border-neutral-200 pb-8">
            <h1 className="text-3xl md:text-5xl font-black text-wcom-ink tracking-tight mb-6">
              Conditions Générales d'Utilisation et de Vente (CGU / CGV) — W-COM
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm font-semibold text-neutral-500">
              <span className="bg-neutral-100 px-3 py-1 rounded-full text-wcom-dark">Version 1.0</span>
              <span>En vigueur depuis le 24 septembre 2026</span>
              <span>Futur Game Diversity (FGD)</span>
            </div>
          </div>

          <div className="prose prose-neutral prose-wcom max-w-none space-y-8 text-neutral-600 font-medium leading-relaxed">
            <p className="text-lg">
              Bienvenue sur <strong>W-COM</strong>, une plateforme développée par Futur Game Diversity (FGD). En téléchargeant, en installant ou en utilisant l'application mobile W-COM, tout utilisateur (acheteur, vendeur, prestataire de services ou livreur) accepte sans réserve les présentes Conditions Générales d'Utilisation et de Vente. Si vous n'acceptez pas ces termes, veuillez cesser toute utilisation de la plateforme.
            </p>
            
            <p>
              W-COM est une plateforme numérique ayant pour mission de créer un véritable écosystème de travail en Côte d'Ivoire, qui combine une place de marché e-commerce et un espace de mise en relation pour des prestations de services. Contrairement à une marketplace traditionnelle, W-COM permet aux utilisateurs :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>d'acheter des produits auprès de boutiques partenaires ;</li>
              <li>de créer leur propre boutique afin de vendre leurs produits ;</li>
              <li>de créer leur propre environnement de travail afin de proposer des services professionnels ;</li>
              <li>d'utiliser différents outils numériques destinés à faciliter le développement de leur activité.</li>
            </ul>
            <p>
              <strong>W-COM intervient exclusivement en tant qu'intermédiaire technologique et d'agrégation financière.</strong> W-COM n'est ni propriétaire, ni vendeur des biens mis en ligne par les marchands, ni employeur des prestataires de services proposant leurs missions sur l'application.
            </p>

            <h2 className="text-2xl font-black text-wcom-ink mt-12 mb-6">Création d'un compte et éligibilité</h2>
            <ul className="list-disc pl-6 space-y-3">
              <li><strong>Condition d'accès :</strong> l'utilisation de W-COM est réservée aux personnes physiques âgées d'au moins 18 ans et disposant de la capacité juridique de contracter, ou aux mineurs disposant d'une autorisation légale expresse.</li>
              <li><strong>Exactitude des informations :</strong> pour accéder aux fonctionnalités de W-COM, l'utilisateur doit créer un compte personnel. L'utilisateur s'engage à fournir des informations exactes lors de son inscription, notamment un numéro de téléphone actif et joignable, compatible avec les services de Mobile Money locaux. Chaque utilisateur est responsable de la confidentialité de son mot de passe, de la sécurité de son compte et de toutes les activités réalisées depuis celui-ci.</li>
            </ul>

            <h2 className="text-2xl font-black text-wcom-ink mt-12 mb-6">Les différents types de comptes disponibles</h2>
            <ul className="list-disc pl-6 space-y-3">
              <li><strong>Le Compte Acheteur</strong> permet d'effectuer des achats, d'enregistrer des favoris, de communiquer avec les boutiques et de suivre ses commandes.</li>
              <li><strong>Le Compte Boutique</strong> permet de créer une boutique, de publier des produits, de recevoir des commandes, de gérer son catalogue, de consulter ses statistiques et d'accéder au système Ascension.</li>
              <li><strong>Le Compte Environnement de travail</strong> permet de créer une activité professionnelle basée sur les services, d'ajouter des collaborateurs, de proposer différents services, de gérer ses revenus et d'accéder aux outils professionnels.</li>
            </ul>

            <h2 className="text-2xl font-black text-wcom-ink mt-12 mb-6">Les abonnements et le portefeuille W-COM</h2>
            <p>Certains services de W-COM nécessitent un abonnement. Plusieurs formules peuvent être proposées : Mensuel, Trimestriel, Annuel, Personnel, Entreprise. Les tarifs sont consultables directement depuis l'application.</p>
            <p>Le portefeuille W-COM permet à l'utilisateur de consulter les opérations liées à son activité sur la plateforme. Chaque compte Marchand/Prestataire dispose d'un portefeuille. Les soldes affichés (Solde Disponible, Solde en Séquestre, Tirelires) sont des écritures comptables reflétant les créances du marchand envers W-COM.</p>
            <div className="bg-wcom-green/10 border border-wcom-green/20 rounded-xl p-5 my-6 text-wcom-green-dark">
              <strong>Adossement financier :</strong> l'argent virtuel affiché dans l'application est strictement adossé aux flux financiers réels, traités et sécurisés par W-COM et ses partenaires agréés d'agrégation de paiement (notamment GeniusPay). Le marchand peut demander le retrait de son « Solde Disponible » à tout moment vers son compte Mobile Money.
            </div>

            <h2 className="text-2xl font-black text-wcom-ink mt-12 mb-6">Système de séquestre (protection des transactions en ligne)</h2>
            <ul className="list-disc pl-6 space-y-3">
              <li><strong>Principe de blocage :</strong> pour tout achat de produit ou de prestation de service payé en ligne, les fonds versés par le client sont isolés sur un compte de séquestre géré par W-COM. Cet argent est temporairement indisponible au retrait pour le marchand.</li>
              <li><strong>Libération des fonds :</strong> les fonds en séquestre sont transférés automatiquement vers le « Solde Disponible » du marchand après : la validation explicite de la bonne réception par le client, la validation électronique par Code de Livraison (OTP), ou la résolution d'un litige en faveur du marchand.</li>
            </ul>

            <h2 className="text-2xl font-black text-wcom-ink mt-12 mb-6">Commissions et tarification W-COM</h2>
            <p>W-COM prélève une commission automatique sur chaque transaction validée. Le taux dépend de la formule d'abonnement souscrite par le marchand :</p>
            <ul className="list-disc pl-6 space-y-2 font-semibold">
              <li>10 % en l'absence d'abonnement actif ;</li>
              <li>5 % avec la formule Mensuel ;</li>
              <li>4 % avec la formule Trimestriel ;</li>
              <li>3 % avec la formule Annuel.</li>
            </ul>
            <p className="mt-4">La commission est calculée sur le montant des produits ou de la prestation (hors frais de livraison) et est déduite à la source au moment du transfert du « Solde en Séquestre » vers le « Solde Disponible ».</p>

            <h2 className="text-2xl font-black text-wcom-ink mt-12 mb-6">Litiges, remboursements et interdictions</h2>
            <p>Les utilisateurs s'engagent à ne pas proposer ni promouvoir des contenus, produits ou services interdits par la loi ou contraires aux valeurs de W-COM (stupéfiants, armes, contrefaçons, etc.). Toute violation entraîne la suppression définitive du compte et la saisie conservatoire du solde.</p>
            <p>En cas de non-conformité d'un produit ou d'une tâche, le client a l'obligation formelle de ne pas transmettre son Code OTP et de déclarer un litige dans l'application sous un délai maximum de 24 heures. W-COM agit en tant qu'arbitre neutre. La décision arbitrale rendue par W-COM est ferme et définitive.</p>

            <div className="mt-16 pt-8 border-t border-neutral-200">
              <h3 className="text-xl font-bold text-wcom-ink mb-4">Contact</h3>
              <p>
                Pour toute question concernant les présentes Conditions Générales, les utilisateurs peuvent contacter Futur Game Diversity (FGD), Support W-COM :<br/>
                <a href="mailto:futurgamediversity@gmail.com" className="text-wcom-green hover:underline font-bold">futurgamediversity@gmail.com</a> | <strong>0576187667</strong>
              </p>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
