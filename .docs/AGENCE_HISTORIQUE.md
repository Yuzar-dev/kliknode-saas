# 📜 AGENCE_HISTORIQUE — KlikNode (Changelog / Journal de bord)

> **Dernière MAJ** : 2026-02-20  
> **Point de reprise** : Ceci est le journal chronologique de toutes les décisions et implémentations.

---

## 📅 2026-02-20 — Audit initial & mémoire externe

### Contexte
Première session de l'agence virtuelle. Audit complet du projet existant.

### Décisions prises
- Le projet s'appelle **KlikNode** (titre dans `layout.tsx`) / **V-Card SaaS** (nom backend `package.json`)
- Architecture monorepo `backend/` + `frontend/` (pas de workspaces npm)
- Stack validée : Next.js 16 + Express 4 + Prisma + PostgreSQL
- shadcn/ui (Tailwind 4) utilisé comme system de composants

### État constaté

**✅ Ce qui est FAIT :**
- Schéma DB complet (17 models Prisma, migrés)
- Auth complète (login, register, forgot/reset password, refresh token, join company)
- 6 controllers Company (dashboard, employees, departments, branding, leads, billing)
- 1 controller Public (profil profil, VCF, exchange contact)
- **Module B2C Complet (Backend & Frontend) :**
  - **Controllers Backend** : `activation.controller.ts`, `operator.controller.ts`, `user.controller.ts`
  - **Routes Backend** : `/api/user/*`, `/api/operator/*`, `/api/public/activate/:uid`
  - **Pages Frontend** : Layout user glassmorphism, éditeur de carte avec preview live, gestionnaire de liens sociaux, analytics perso, page activation (5 états), page opérateur (encode/pair/stats)
- Backend Admin : Les 10 contrôleurs (dashboard, company, operator, etc.) sont créés et connectés au front ! Seule la création d'entreprise est manquante.
- Frontend Company : 7 pages (dashboard, employees, groups, branding, leads, lock, subscription)
- Frontend Auth : 5 pages (login, signup, forgot-password, reset-password, join)
- Middleware RBAC Next.js complet (super_admin, company_admin, employee, operator)
- API client Axios avec interceptors (auto-refresh)
- Store Zustand persisté pour auth

**❌ Ce qui MANQUE (critique) :**
- Création d'entreprise depuis l'admin (Onboarding B2B) non implémentée côté backend (Mock)
- Service S3 upload non implémenté
- 0 tests
- Pas de CI/CD

### Fichiers créés
- `/.docs/AGENCE_VISION_GLOBALE.md`
- `/.docs/AGENCE_TECH_STACK.md`
- `/.docs/AGENCE_UI_UX.md`
- `/.docs/AGENCE_BACKLOG.md`
- `/.docs/AGENCE_HISTORIQUE.md` (ce fichier)
- `/.docs/AGENCE_PASSATION.md`

---

## 📅 Entrées précédentes (issues des conversations passées)

### ~2026-02-18 — Public VCard Profile
- Implémentation de la page profil public `/p/[slug]`
- Backend controller `public/card.controller.ts` pour servir les données de profil
- Modal d'échange de contact
- Téléchargement VCF

### ~2026-02-17 — Admin Button Styles
- Uniformisation des boutons noirs (hover/click effects) sur toutes les pages admin
- Fix bug icônes Companies List

### ~2026-02-14 — Admin Layout
- Création `AdminSidebar`, `AdminHeader`, `AdminLayout`
- Dashboard admin page
- Navigation active link highlighting

### ~2026-02-12 — Public Profile & Activation
- Routes dynamiques pour profil public
- Logique de routage d'activation

### ~2026-02-09 — Login & DB Issues
- Correction problèmes de login post-configuration HTTPS
- Restauration/reconfiguration base de données

### ~2026-02-03 — Company & UI Refactoring
- Corrections création d'établissement
- Refactoring UI RepDo → KlikNode

---

## 📅 Mai 2026 — Finalisation Super Admin & Logistique

### Contexte
Intervention pour consolider et finaliser la totalité du panneau Super Admin (`/admin`), la logistique B2B/B2C et la connectivité aux données réelles de la base Prisma.

### Ce qui a été accompli
1. **Modèle de Données & Assignation (Workflow B2B/B2C)**
   - Audit des cartes et modification du trigger SQL `handle_new_user` pour séparer et gérer sans bug l'assignation d'une puce via le scan d'une carte `in_stock`.
   - Ajout des routes et de la logique de lien pour l'onboarding d'un employé B2B (`/join/employee?card_id=[uid]&company_id=[id]`).
   - Le modèle Prisma a été mis à jour avec `companyId`, `batchTag`, `status` et `warehouse` sur la table `PhysicalCard` (+ migration DB via `db push`).
   
2. **Super Admin : Dashboard Global**
   - Remplacement de la plupart des données mockées du Dashboard par les statistiques réelles extraites des bases (Plans, Inscriptions, Cartes physiques).
   - Gestion des erreurs TypeScript dans la génération des logs.

3. **Super Admin : Onboarding B2B (Création Entreprise)**
   - Création de la route Backend `POST /api/admin/companies`.
   - Câblage de l'interface Frontend `/admin/companies/new` avec le formulaire dynamique, l'association à un plan `isActive`, et correction de l'extraction des données du tableau des plans.

4. **Super Admin : Finances & Transactions**
   - Mise en place du tri ASC/DESC par date.
   - Ajout du bouton "Refund" (Rembourser) dans les actions de la table.
   
5. **Super Admin : Codes Promo**
   - Connexion à la BDD pour la liste, la suppression, et le toggle actif/inactif.
   - Ajout d'une modale pour créer ou modifier entièrement un code promo (`POST` et `PATCH`).
   - Calcul dynamique du taux d'utilisation (`Performance Moyenne`) et filtre par statut.

6. **Super Admin : Gestion des Stocks & Lots (Batch Generator)**
   - **Stocks :** Implémentation du bouton "Ajuster Stock" qui exécute un upsert sur la BDD, permettant de réapprovisionner ou de créer de nouveaux SKUs directement depuis l'UI.
   - **Batch Generator :** Ajout des routes backend manquantes. Génération persistante en masse des tags NFC (via `createMany` dans Prisma).
   - Correction du téléchargement CSV des lots.

7. **Super Admin : Commandes Hardware**
   - Ajout d'une modale pour créer une commande (avec menu déroulant listant les vraies entreprises clientes).
   - Ajout d'une modale pour mettre à jour le statut (En préparation, Expédié, etc.) et définir le numéro de suivi de colis (`trackingNumber`).

### Bilan de l'étape
L'interface Super Admin est désormais **100% fonctionnelle**. Toutes les métriques, la création d'entités (Clients B2B, Promotions, Inventaires) et la logistique d'expédition sont réelles et répercutées dans la base PostgreSQL.
