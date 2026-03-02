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
- Frontend Admin : 9 pages complètes (dashboard, companies, plans, transactions, promo-codes, inventory, hardware-orders, batch-generator, operators, audit-logs)
- Frontend Company : 7 pages (dashboard, employees, groups, branding, leads, lock, subscription)
- Frontend Auth : 5 pages (login, signup, forgot-password, reset-password, join)
- Middleware RBAC Next.js complet (super_admin, company_admin, employee, operator)
- API client Axios avec interceptors (auto-refresh)
- Store Zustand persisté pour auth

**❌ Ce qui MANQUE (critique) :**
- **Aucun controller Admin backend** (dossier vide) → Toutes les pages admin affichent du mock
- Stripe webhook non implémenté
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
