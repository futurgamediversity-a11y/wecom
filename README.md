# W-COM Web

Version web (Next.js) de l'application mobile W-COM, plateforme ivoirienne
de commerce et d'espaces de travail. Vise un usage **desktop-first** (tout
en restant utilisable sur tablette/mobile).

## Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS 3**
- **lucide-react** (icônes)
- `clsx` + `tailwind-merge` + `class-variance-authority` (variantes UI)

## Démarrer

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Structure

```
src/
  app/
    page.tsx               # Landing / welcome (rôle-select hero)
    login/                 # Connexion
    register/              # Inscription
    role/                  # Sélection acheter / vendre après login
    (buyer)/               # Routes acheteur (top-nav + footer partagés)
      shop/                # Boutique / accueil acheteur
      product/[id]/        # Détails produit
      cart/                # Panier
      checkout/            # Validation commande
      payment/             # Choix du paiement
      orders/              # Mes commandes
      favorites/           # Favoris
      profile/             # Profil acheteur
  components/
    brand/                 # Logo W-COM
    site/                  # Top-nav, footer
    ui/                    # Button, Input, Card
  lib/
    cn.ts                  # Utilitaire de classes
    format.ts              # Format XOF + date FR
    mock-data.ts           # Données placeholder
public/
  images/                  # Logos + visuels paiement (Wave, OM, MoMo, Moov, carte)
```

## Tokens de design

Portés depuis `lib/screens/theme_manager.dart` et les écrans Flutter :

- Primaire : `#FF8200` (orange W-COM)
- Secondaire : `#009639` (vert W-COM)
- Fond clair : `#FAFAFA`
- Surface sombre : `#1E202A`
- Encre : `#090A0F`

## Roadmap

Cette première phase couvre le tunnel acheteur (12 écrans). Les phases
suivantes ajoutent :

- **Phase 2** : tableau de bord vendeur, ajout/édition produit, stock, statistiques.
- **Phase 3** : workspace / espace entreprise (inscription, dashboard, chat, abonnement).
- **Phase 4** : livreur, AI assistant (Gemini), admin support, polissage et i18n.

## Branches GitLab d'origine

- Code Flutter de référence : `git@gitlab.com:futurgamediversity1/W-Com.git` (branche `main`)
- Cible web : `git@gitlab.com:futurgamediversity1/w-com_web.git`
