import { WComLogo } from "@/components/brand/wcom-logo";
import Link from "next/link";

export const metadata = {
  title: "Politique de Confidentialité | W-COM",
  description: "Politique de Confidentialité et de Protection des Données à Caractère Personnel de W-COM",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-neutral-50 selection:bg-wcom-orange/20">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/">
            <WComLogo size="sm" />
          </Link>
          <nav className="flex gap-6 text-sm font-bold text-neutral-500">
            <Link href="/" className="hover:text-wcom-orange transition">Accueil</Link>
            <Link href="/legal/terms" className="hover:text-wcom-orange transition">CGU / CGV</Link>
          </nav>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-6 py-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="rounded-3xl bg-white p-8 md:p-16 shadow-sm border border-neutral-200">
          <div className="mb-12 border-b border-neutral-200 pb-8">
            <h1 className="text-3xl md:text-5xl font-black text-wcom-ink tracking-tight mb-6">
              Politique de Confidentialité et de Protection des Données à Caractère Personnel — W-COM
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm font-semibold text-neutral-500">
              <span className="bg-neutral-100 px-3 py-1 rounded-full text-wcom-dark">Version 1.0</span>
              <span>En vigueur depuis le 24 septembre 2026</span>
              <span>Futur Game Diversity (FGD)</span>
            </div>
          </div>

          <div className="prose prose-neutral prose-wcom max-w-none space-y-8 text-neutral-600 font-medium leading-relaxed">
            <p className="text-lg">
              La présente Politique de Confidentialité décrit la manière dont <strong>W-COM</strong> collecte, utilise, stocke, partage et protège les données à caractère personnel de ses utilisateurs (acheteurs, marchands, prestataires de services et livreurs) en République de Côte d'Ivoire.
            </p>
            <p>
              En utilisant l'application mobile W-COM, vous consentez aux pratiques décrites ci-dessous, établies dans le strict respect de la réglementation ivoirienne en vigueur, notamment la <em>Loi n° 2013-450 du 19 juin 2013</em> relative à la protection des données à caractère personnel, sous le contrôle de l'Autorité de Régulation des Télécommunications/TIC de Côte d'Ivoire (ARTCI).
            </p>

            <h2 className="text-2xl font-black text-wcom-ink mt-12 mb-6">Section 1 : Les données collectées par W-COM</h2>
            <p>Pour assurer le bon fonctionnement de sa place de marché hybride (e-commerce et prestations de services), W-COM collecte uniquement les informations strictement nécessaires :</p>
            <ul className="list-disc pl-6 space-y-3">
              <li><strong>1.1. Données d'identité et de profil :</strong> lors de la création d'un compte, nous collectons votre nom, votre prénom, votre pseudonyme (le cas échéant), votre adresse e-mail, votre photo de profil, ainsi que votre numéro de téléphone principal.</li>
              <li><strong>1.2. Données de localisation (GPS) :</strong> nous collectons votre position géographique précise ou approximative. Cette donnée est nécessaire pour permettre l'affichage des boutiques et des freelances à proximité (fonctionnalité « Près de chez vous »), pour calculer les frais de livraison par commune (par exemple Cocody, Yopougon, Marcory) et pour permettre le ciblage des campagnes marketing locales lancées par les marchands.</li>
              <li><strong>1.3. Données financières et de transaction :</strong> nous collectons et traitons les numéros de téléphone associés à vos comptes Mobile Money (Wave, Orange Money, MTN Money, Moov Money) utilisés pour effectuer des rechargements, régler des commandes ou recevoir des décaissements via notre partenaire d'agrégation de paiement (GeniusPay).</li>
            </ul>
            <div className="bg-wcom-orange/10 border border-wcom-orange/20 rounded-xl p-5 my-6 text-wcom-orange-dark">
              <strong>Note de sécurité importante :</strong> W-COM ne collecte, ne demande et ne stocke aucun code secret, mot de passe ou code PIN Mobile Money.
            </div>
            <ul className="list-disc pl-6 space-y-3">
              <li><strong>1.4. Données d'activité et de navigation :</strong> nous enregistrons l'historique de vos transactions, vos commandes en séquestre, l'état de vos tirelires/coffres, ainsi que les échanges de messages effectués dans le chat interne de l'application (utilisés à des fins d'arbitrage en cas de litige).</li>
            </ul>

            <h2 className="text-2xl font-black text-wcom-ink mt-12 mb-6">Section 2 : Finalités de la collecte</h2>
            <p>Les données personnelles collectées par W-COM sont traitées pour des finalités précises, explicites et légitimes :</p>
            <ul className="list-disc pl-6 space-y-3">
              <li><strong>2.1. Fourniture du service :</strong> mettre en relation techniquement les acheteurs, les marchands et les prestataires, et gérer le catalogue de produits et de services.</li>
              <li><strong>2.2. Gestion financière (portefeuille et séquestre) :</strong> assurer la tenue des écritures comptables dans le portefeuille virtuel (Ledger), sécuriser les fonds en séquestre, prélever la commission applicable à la formule d'abonnement du marchand et exécuter les retraits vers vos comptes Mobile Money.</li>
              <li><strong>2.3. Sécurité et prévention de la fraude :</strong> générer, envoyer et vérifier les Codes de Livraison (OTP) pour authentifier la bonne exécution des commandes, et prévenir les activités frauduleuses ou le blanchiment de capitaux.</li>
              <li><strong>2.4. Personnalisation et marketing :</strong> afficher un flux d'accueil pertinent selon votre localisation et vos habitudes d'achat, et exécuter les campagnes de visibilité souscrites par les marchands.</li>
              <li><strong>2.5. Support client et arbitrage :</strong> résoudre les litiges commerciaux entre utilisateurs en analysant l'historique des commandes et les messages échangés sur la plateforme.</li>
            </ul>

            <h2 className="text-2xl font-black text-wcom-ink mt-12 mb-6">Section 3 : Partage des données avec des tiers</h2>
            <p>W-COM s'engage formellement à ne jamais vendre, louer ou commercialiser vos données personnelles à des tiers ou à des courtiers en données. Votre profil est partagé uniquement dans les cas suivants :</p>
            <ul className="list-disc pl-6 space-y-3">
              <li><strong>3.1. Partenaires de paiement et agrégateurs :</strong> nous transmettons votre numéro de téléphone, l'identifiant de commande et le montant de la transaction à notre partenaire technologique et financier (GeniusPay), ainsi qu'aux opérateurs Mobile Money concernés, dans le seul but de déclencher les requêtes de paiement ou de verser vos retraits.</li>
              <li><strong>3.2. Entre utilisateurs (exécution de la commande) :</strong> lors d'un achat ou d'une commande de service, le numéro de téléphone et l'adresse de livraison du client sont partagés temporairement avec le marchand et le livreur assigné. Ce partage est strictement limité au temps nécessaire à la livraison ou à la réalisation de la prestation.</li>
              <li><strong>3.3. Obligations légales et judiciaires :</strong> W-COM peut être amené à communiquer vos données aux autorités juridictionnelles ou administratives compétentes (notamment l'ARTCI ou les autorités judiciaires ivoiriennes) en cas de réquisition légale formelle ou pour faire valoir ses droits en justice.</li>
            </ul>

            <h2 className="text-2xl font-black text-wcom-ink mt-12 mb-6">Section 4 : Hébergement et sécurité des données</h2>
            <ul className="list-disc pl-6 space-y-3">
              <li><strong>4.1. Infrastructures cloud sécurisées :</strong> l'ensemble de vos données est hébergé et sécurisé sur des serveurs cloud de niveau international (notamment sur l'infrastructure Google Cloud / Firebase Platform).</li>
              <li><strong>4.2. Chiffrement des communications :</strong> toutes les transmissions de données entre votre application mobile W-COM et nos serveurs sont protégées par des protocoles de chiffrement conformes aux normes de l'industrie (SSL / TLS).</li>
              <li><strong>4.3. Protection du code et du backend :</strong> l'accès aux soldes financiers et leur modification (wallet_ledger) sont impérativement restreints et gérés par des scripts serveurs sécurisés, rendant impossible toute manipulation non autorisée des fonds ou des profils.</li>
            </ul>

            <h2 className="text-2xl font-black text-wcom-ink mt-12 mb-6">Section 5 : Vos droits sur vos données</h2>
            <p>Conformément à la Loi ivoirienne n° 2013-450 sur la protection des données à caractère personnel et aux exigences des plateformes de distribution (Google Play Store et Apple App Store), vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 space-y-3">
              <li><strong>5.1. Droit d'accès et de rectification :</strong> vous pouvez à tout moment consulter, mettre à jour et modifier votre profil depuis l'onglet « Paramètres » de l'application.</li>
              <li><strong>5.2. Droit de suppression (droit à l'oubli) :</strong> vous pouvez solliciter la suppression définitive de votre compte W-COM et de vos données personnelles via un bouton dédié dans les paramètres, ou en formulant une demande officielle par courrier électronique.</li>
              <li><strong>5.3. Exception de conservation légale et comptable :</strong> en cas de suppression de compte, vos données d'identification sont effacées ou anonymisées. Toutefois, W-COM est légalement tenu de conserver l'historique brut de vos transactions pendant cinq (5) ans pour satisfaire aux obligations fiscales et comptables ivoiriennes.</li>
            </ul>

            <div className="mt-16 pt-8 border-t border-neutral-200">
              <h3 className="text-xl font-bold text-wcom-ink mb-4">Contact</h3>
              <p>
                Pour toute question relative à la présente Politique de Confidentialité ou pour exercer vos droits, contactez Futur Game Diversity (FGD), Support W-COM :<br/>
                <a href="mailto:futurgamediversity@gmail.com" className="text-wcom-orange hover:underline font-bold">futurgamediversity@gmail.com</a> | <strong>0576187667</strong>
              </p>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
