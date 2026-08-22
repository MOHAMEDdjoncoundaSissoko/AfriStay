# AfriStay

Plateforme de réservation de logements en Afrique de l'Ouest. Clone d'Airbnb adapté au marché local avec support multi-devises et paiements mobile money.

## Fonctionnalités

- Recherche avancée avec filtres (ville, prix, chambres, équipements) et carte interactive Leaflet
- Création de logements multi-étapes avec upload photos Cloudinary
- Réservation avec calendrier interactif et calcul automatique des prix
- Paiements via CinetPay (Orange Money, Wave, MTN, Moov, carte bancaire) et Paystack (Naira, Cedi, Shilling, Rand)
- Messagerie entre voyageur et hôte
- Avis 5 étoiles avec réponse de l'hôte
- Système de favoris
- Notifications in-app (10 types d'événements)
- Dashboards voyageur et hôte avec statistiques
- Panneau d'administration complet (utilisateurs, logements, réservations, paiements, commissions, rapports)
- Vérification d'identité (upload CNI/Passeport)
- Mode sombre
- SEO dynamique (Server Components, Open Graph)
- PWA (installable sur téléphone)
- Multi-devises avec taux de change en temps réel (XOF, NGN, GHS, KES, ZAR, USD, EUR)
- Menu adapté selon le rôle (voyageur, hôte, admin)

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | Next.js 15 (App Router), Tailwind CSS, next-themes |
| Backend | NestJS 10, Passport JWT, class-validator |
| Base de données | PostgreSQL 16 (Prisma 6) |
| Cache | Redis 7 (installé, non utilisé) |
| Paiements | CinetPay, Paystack |
| Upload | Cloudinary |
| Carte | Leaflet |
| Outil monorepo | Turborepo, PNPM |
| Langage | TypeScript 5.9 |

## Prérequis

- Node.js 26+
- PNPM 11+
- Docker et Docker Compose
- Un compte CinetPay (gratuit, sandbox) pour les paiements

## Installation

```bash
# Cloner le projet
git clone <repo-url>
cd AfriStay

# Installer les dépendances
pnpm install

# Lancer PostgreSQL et Redis
docker compose -f docker/docker-compose.yml up -d

# Générer le client Prisma
cd apps/api
pnpm exec prisma migrate deploy
pnpm exec prisma db seed

# Lancer l'API (port 4000)
pnpm run dev

# Lancer le frontend (port 3000)
cd apps/web
pnpm run dev
# L'application est accessible sur http://localhost:3000, l'API sur http://localhost:4000, la doc Swagger sur http://localhost:4000/api/docs.

```

## Structure du projet
AfriStay/
├── apps/
│   ├── api/          → Backend NestJS
│   └── web/          → Frontend Next.js
├── packages/
│   └── shared/       → Types et constantes partagés
├── docker/           → PostgreSQL 16 + Redis 7
└── archive/          → Prototype HTML initial


## Scripts
# Root
pnpm run dev          # Lance tout en mode dev (Turborepo)
pnpm run build        # Build tout

# Backend
cd apps/api
pnpm run dev          # Serveur en mode watch
pnpm run start        # Production
pnpm run seed         | Peupler la base de données
pnpm exec prisma migrate dev --name xxx  # Créer une migration
pnpm exec prisma studio                # Ouvrir Prisma Studio

# Frontend
cd apps/web
pnpm run dev          # Serveur en mode watch
pnpm run build        # Build production
pnpm run start        # Production


## Variables d'environnement
# Backend (apps/api/.env)
DATABASE_URL=postgresql://user:pass@localhost:5432/afristay
JWT_ACCESS_SECRET=clé-secrète-32-caractères-min
JWT_REFRESH_SECRET=clé-secrète-32-caractères-min
CINETPAY_API_KEY=votre-clé-api
CINETPAY_SITE_ID=votre-site-id
CINETPAY_SECRET_KEY=votre-clé-secrète
CINETPAY_BASE_URL=https://api.cinetpay.com/v2
CINETPAY_IS_SANDBOX=true
PAYSTACK_SECRET_KEY=votre-clé-secrête-paystack
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:4000

#Frontend (apps/web/.env.local)
NEXT_PUBLIC_API_URL=http://localhost:4000


##Base de données
#19 tables, 9 enums, 7 migrations :
#11 pays, 19 villes, 6 types de logement, 20 équipements
#7 devises avec taux de change dynamiques
#Politiques d'annulation (flexible, modérée, stricte)
#Commissions configurables par type de logement


## API
#Documentation Swagger auto-générée : http://localhost:4000/api/docs
#Endpoints principaux
| Méthode | Route | Rôle |
|---|---|---|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/refresh` | Rafraîchir le token |
| GET | `/api/properties` | Liste des logements avec filtres |
| POST | `/api/properties` | Créer un logement |
| GET | `/api/properties/:id` | Détail d'un logement |
| POST | `/api/bookings` | Créer une réservation |
| PATCH | `/api/bookings/:id/accept` | Hôte accepte |
| PATCH | `/api/bookings/:id/reject` | Hôte refuse |
| POST | `/api/payments/initiate` | Lancer un paiement |
| POST | `/api/payments/webhook/cinetpay` | Webhook CinetPay |
| POST | `/api/payments/webpost/webhook/paystack` | Webhook Paystack |
| GET | `/api/currencies` | Liste des devises avec taux |
| GET | `/api/notifications` | Notifications de l'utilisateur |
| POST | `/api/messages/conversations` | Créer une conversation |
| GET | `/api/admin/dashboard` | Statistiques admin |
| POST | `/api/contact` | Contacter le support |


#Licence
#Privée — Tous droits réservés.