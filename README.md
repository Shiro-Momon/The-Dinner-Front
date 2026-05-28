# TheDinner — Frontend

[![CI](https://img.shields.io/badge/CI-GitHub_Actions-blue?logo=githubactions)](https://github.com/Shiro-Momon/The-Dinner-Front/actions)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)

---

## Description

Interface web du système de digitalisation de commande et de paiement pour un restaurant.  
Ce frontend consomme l'[API REST TheDinner](../TheDinner) et couvre deux rôles distincts :

- **Admin / Staff** — tableau de bord, gestion du menu, des tables, des commandes, vue cuisine, encaissement
- **Client** — sélection de la table ou commande à emporter, navigation du menu, paiement par carte

Le projet est un **projet académique Ynov M1 Full Stack** évalué sur CI/CD & DevOps.

---

## Stack technique

| Outil | Version | Justification |
|-------|---------|---------------|
| Next.js | 16.2 | App Router, SSR/CSR hybride, routing par fichiers |
| React | 19 | Dernière version stable, Concurrent Features |
| TypeScript | 5 | Typage strict, détection d'erreurs au build |
| Tailwind CSS | 4 | Utility-first, pas de CSS custom à maintenir |
| shadcn/ui + Base UI | latest | Composants accessibles (Dialog, Select, Tabs…), non opinionnés sur le style |
| lucide-react | latest | Bibliothèque d'icônes cohérente et légère |
| sonner | 2 | Toasts — feedback utilisateur sur toutes les actions API |
| next-themes | latest | Dark/light mode sans flash |
| ESLint (eslint-config-next) | 9 | Linting intégré Next.js, règles React et TypeScript |

**Pourquoi Next.js App Router ?** Le découpage par route groups `(admin)` et `(customer)` permet de partager des layouts différents (sidebar admin vs. layout client minimaliste) sans duplication, et les Server Components réduisent le JavaScript envoyé au client pour les pages sans interactivité.

---

## Architecture

```
src/
├── app/                          # App Router Next.js
│   ├── layout.tsx                # Root layout — providers globaux, Toaster
│   ├── (admin)/                  # Route group admin (sidebar NavSidebar)
│   │   ├── layout.tsx            # Layout avec NavSidebar
│   │   ├── page.tsx              # Dashboard  →  /
│   │   ├── menu/page.tsx         # Gestion menu  →  /menu
│   │   ├── tables/page.tsx       # Gestion tables  →  /tables
│   │   ├── orders/
│   │   │   ├── page.tsx          # Liste commandes  →  /orders
│   │   │   ├── new/page.tsx      # Nouvelle commande  →  /orders/new
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Détail commande  →  /orders/[id]
│   │   │       └── payment/page.tsx  # Paiement admin  →  /orders/[id]/payment
│   │   ├── payments/[id]/page.tsx    # Reçu  →  /payments/[id]
│   │   ├── kitchen/page.tsx      # Vue cuisine  →  /kitchen
│   │   └── tables/page.tsx
│   └── (customer)/               # Route group client (layout minimaliste)
│       └── customer/
│           ├── page.tsx          # Accueil client  →  /customer
│           └── menu/page.tsx     # Menu client  →  /customer/menu
├── components/
│   ├── nav-sidebar.tsx           # Navigation admin
│   ├── status-badge.tsx          # Badge coloré par OrderStatus
│   └── ui/                       # Composants shadcn/ui
├── lib/
│   ├── api.ts                    # Toutes les fonctions fetch (source unique)
│   ├── categories.ts             # Constantes MenuItemCategory (clés string)
│   └── utils.ts                  # cn() et helpers
└── types/
    └── index.ts                  # Types TypeScript — miroir des DTOs backend
```

**Règles d'architecture :**
- `src/lib/api.ts` est le **seul** endroit où les URLs d'API sont écrites
- `src/types/index.ts` est la **source de vérité** des DTOs — doit rester en sync avec le backend
- Les pages `(admin)` héritent du layout avec sidebar ; les pages `(customer)` ont leur propre layout épuré

---

## Flux utilisateur

### Admin
```
/  (Dashboard)
├── /menu          CRUD des plats
├── /tables        Gestion des tables (créer, occuper, libérer)
├── /orders        Liste filtrée par statut
│   ├── /orders/new          Créer une commande (table + items + pricing)
│   └── /orders/[id]         Cycle de vie + bouton paiement
│       └── /orders/[id]/payment   Encaissement (tip + méthode)
├── /kitchen       Vue colonnes temps réel (polling 20s)
└── /payments/[id] Reçu de paiement
```

### Client
```
/customer                     Choix : Dîner / À emporter
├── (dîner) → sélection table
└── (à emporter)
        └── /customer/menu    Parcours menu → Confirmer → Paiement
                              ├── Payer par carte → confirm auto → cuisine
                              └── Payer au comptoir → ordre reste Pending
```

---

## Lancer le projet en local

### Prérequis
- Node.js ≥ 20
- L'[API TheDinner](../TheDinner) qui tourne sur `http://localhost:8080`  
  (le plus simple : `docker-compose up` dans le dossier TheDinner)

### Démarrage

```bash
git clone https://github.com/Shiro-Momon/The-Dinner-Front.git
cd The-Dinner-Front
npm install
npm run dev
```

L'application est disponible sur **http://localhost:3000**.

Le fichier `next.config.ts` proxifie automatiquement `/api/*` vers `http://localhost:8080/api/*` — aucune variable d'environnement n'est requise en développement.

### Build de production

```bash
npm run build
npm run start
```

---

## Lancer les tests

```bash
# Vérification TypeScript (zéro erreur attendu)
npx tsc --noEmit

# Lint ESLint
npm run lint
```

> Ce projet ne dispose pas encore d'une suite de tests unitaires front-end (Vitest / Jest).  
> La couverture est assurée par les tests d'intégration du backend et la vérification TypeScript stricte.

---

## Pipeline CI/CD

> Le frontend ne dispose pas encore d'un pipeline CI/CD dédié.  
> Le pipeline suivant est l'objectif cible :

```
push / pull_request → main
           │
           ▼
┌──────────────────────────────┐
│           lint-build         │
│  1. npm install              │
│  2. npx tsc --noEmit         │  ← bloque si erreur TypeScript
│  3. npm run lint             │  ← bloque si violation ESLint
│  4. npm run build            │  ← bloque si build échoue
└──────────────────────────────┘
```

**Intégration avec l'API backend :** le frontend dépend de l'API TheDinner. En CI, les tests d'intégration backend couvrent les contrats d'API dont dépend ce frontend.

---

## Navigation

| Route | Rôle | Accès |
|-------|------|-------|
| `/` | Dashboard tables + compteurs | Admin |
| `/menu` | CRUD menu | Admin |
| `/tables` | Gestion tables | Admin |
| `/orders` | Liste commandes | Admin |
| `/orders/new` | Nouvelle commande | Admin |
| `/orders/[id]` | Détail + cycle de vie | Admin |
| `/orders/[id]/payment` | Encaissement | Admin |
| `/kitchen` | Vue cuisine temps réel | Cuisine |
| `/payments/[id]` | Reçu de paiement | Admin |
| `/customer` | Accueil client | Client |
| `/customer/menu` | Parcours commande client | Client |
