# Architecture Technique - KlikNode SAAS

Ce document décrit l'organisation technique du monorepo KlikNode, la modélisation de sa base de données et les flux d'intégration avec les services tiers.

---

## 1. Structure du Codebase (Le Monorepo)
Le projet est organisé sous forme de monorepo composé de deux applications distinctes en local :

*   **Frontend (`/frontend`)** :
    *   **Framework** : Next.js 16 (App Router) et React 19.
    *   **Styling** : Tailwind CSS v4, composants Shadcn/ui (Radix UI), animations personnalisées.
    *   **Gestion d'état** : Zustand pour les stores globaux (session, utilisateur), React Query pour les requêtes asynchrones côté client.
*   **Backend (`/backend`)** :
    *   **Technologie** : Node.js avec Express écrit en TypeScript.
    *   **ORM** : Prisma ORM pour le requêtage de la base de données.
    *   **Sécurité** : JWT (`jsonwebtoken`), Bcryptjs, middlewares de filtrage par rôles.

> 💡 **Particularité de déploiement** : En production sur Vercel, le backend Express est hébergé **au sein du frontend** sous le répertoire `/frontend/server/` (qui est une copie conforme de `/backend/src/`). Une route catch-all de Next.js (`/frontend/pages/api/[[...slug]].ts`) intercepte les requêtes `/api/*` et redirige le trafic vers ce serveur Express intégré.

---

## 2. Infrastructure et Base de Données

La base de données est hébergée sur **Supabase (PostgreSQL)**.

### Connexion et Pooling (PgBouncer)
Pour gérer les montées en charge sans épuiser les connexions Postgres (environnement Serverless Vercel), deux URL de connexion sont configurées :
*   `DATABASE_URL` : Pointe vers le port **6543** (PgBouncer en mode Transaction). Utilisé par l'application pour les requêtes quotidiennes.
*   `DIRECT_URL` : Pointe vers le port **5432** (PostgreSQL en mode Session). Utilisé exclusivement pour exécuter les migrations Prisma.

### Modélisation de Données (Prisma)
Le schéma est composé de modèles essentiels gérant le multi-tenant B2B et le B2C :
*   `User` & `Company` : Modélisation des comptes utilisateurs et des entreprises.
*   `Card` : Contient les informations de la carte digitale (champs texte, slug public, couleurs, et liens sociaux stockés dans un champ JSON).
*   `Lead` : Gère les contacts B2C capturés lors de l'échange public.
*   `ContactLead` : Gère les contacts B2B liés à une entreprise.
*   `LinkClick` & `CardScan` : Enregistrent respectivement les clics sur les boutons d'action d'un profil et le scan global de la carte physique.

---

## 3. Authentification & Rôles
Un double mécanisme d'authentification coexiste sur le projet :
1.  **Supabase Auth** : Gère la connexion et l'inscription côté client frontend (génération de cookies de session sécurisés).
2.  **Custom JWT** : Les routes de l'API Express demandent un token JWT personnalisé. Une route `/api/auth/sync` permet de convertir une session Supabase active en un JWT KlikNode au moment du chargement de l'application.

### Rôles Utilisateurs (`UserRole`)
*   `USER` : Compte professionnel individuel (standard ou PRO).
*   `EMPLOYEE` : Collaborateur rattaché à une entreprise.
*   `MANAGER` : Administrateur d'une entreprise (B2B).
*   `OPERATOR` : Agent logistique chargé d'encoder et d'associer les cartes physiques NFC.
*   `ADMIN` : Administrateur global de la plateforme KlikNode.

---

## 4. Intégrations et Services Tiers
*   **Paiement & Abonnements** : **Stripe** (intégration de Stripe Checkout pour la souscription et du Stripe Customer Portal pour l'auto-résiliation).
*   **Envoi d'e-mails** : **Hostinger SMTP** (`smtp.hostinger.com:465` via l'adresse `service@kliknode.com`) gérant les mails de confirmation et de notification.
*   **Stockage de fichiers** : **AWS S3** ou **Supabase Storage** pour l'hébergement des avatars de profils et des logos d'entreprises.
*   **Portefeuille Mobile** : **PassKit** pour la génération de fichiers `.pkpass` compatibles Apple Wallet et Google Wallet.
