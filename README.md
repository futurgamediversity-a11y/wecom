# W-COM (Futur Game Diversity - FGD)

W-COM est une plateforme numérique innovante en Côte d'Ivoire, conçue comme un véritable écosystème de travail. C'est une place de marché hybride qui combine **e-commerce** et **prestations de services** (freelance).

## 🚀 Fonctionnalités Principales

- **Marketplace e-commerce :** Achat de produits physiques auprès de boutiques locales partenaires.
- **Espace Freelance & Services :** Proposition et réservation de missions professionnelles.
- **Paiements Locaux Sécurisés :** Intégration de Mobile Money (Wave, Orange, MTN, Moov) via l'agrégateur **GeniusPay**.
- **Séquestre Financier :** Les fonds sont bloqués sur un compte sécurisé jusqu'à la livraison et validation du produit (système OTP).
- **Tableau de Bord Vendeur :** Gestion des produits, des statistiques, et de la marque (bannière, logo).
- **Interface Mobile First :** Design 100% responsif, fluide et pensé pour les utilisateurs de smartphones.

## 🛠 Stack Technique

- **Frontend :** Next.js 15 (App Router), React 19, Tailwind CSS, Lucide Icons
- **Backend & Base de données :** Firebase (Authentication, Firestore, Storage)
- **Hébergement & Déploiement :** Vercel
- **Gestion des images :** Cloudinary (via Next.js API Routes)
- **Paiement :** GeniusPay API

## 📦 Installation et Lancement en local

1. **Cloner le dépôt :**
   ```bash
   git clone https://github.com/futurgamediversity-a11y/wecom.git
   cd wecom
   ```

2. **Installer les dépendances :**
   ```bash
   npm install
   ```

3. **Variables d'environnement :**
   Créez un fichier `.env.local` à la racine et renseignez les clés suivantes :
   ```env
   # Firebase Config
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # GeniusPay
   GENIUSPAY_API_KEY=your_geniuspay_key
   GENIUSPAY_API_SECRET=your_geniuspay_secret

   # Plans Vendeur (Wcom Vente)
   NEXT_PUBLIC_PLAN_MONTHLY_PRICE=5000
   NEXT_PUBLIC_PLAN_ANNUAL_PRICE=50000
   ```

4. **Lancer le serveur de développement :**
   ```bash
   npm run dev
   ```
   L'application sera accessible sur [http://localhost:3000](http://localhost:3000).

## 🔒 Architecture et Flux Vendeur (Seller Flow)

1. **Accueil (`/`) :** Navigation intuitive, design Bento Grid responsive.
2. **Choix du rôle (`/seller-setup`) :** Point d'entrée pour les créateurs. Permet de choisir entre *Créer une boutique* ou *Créer un espace de services*.
3. **Onboarding Boutique (`/seller/dashboard`) :** 
   - Si aucune boutique n'est détectée : Affichage d'un assistant (Wizard) en popup (flouté) pour configurer la boutique (nom, logo, bannière), ajouter un premier produit, et choisir un plan d'abonnement.
   - Si la boutique existe : Redirection transparente vers le gestionnaire de produits et statistiques.

## 📄 Pages Légales

Les documents officiels de conformité ivoirienne (ARTCI) sont implémentés en tant que pages Markdown statiques :
- Politique de Confidentialité : `/legal/privacy`
- Conditions Générales d'Utilisation et de Vente : `/legal/terms`

## 🤝 Contribution

Ce projet est maintenu par l'équipe **Futur Game Diversity (FGD)**. Toute modification apportée au code doit respecter l'architecture existante et conserver une expérience utilisateur Mobile-First fluide.
