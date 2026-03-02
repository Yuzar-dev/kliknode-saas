# 📋 AGENCE_BACKLOG — KlikNode

> **Dernière MAJ** : 2026-02-20  
> **Version** : 1.0.0

---

## Légende

| Statut | Signification |
|--------|---------------|
| ✅ | Terminé |
| 🔨 | En cours |
| ⏳ | À faire |
| 🔴 | Bloqué / Priorité haute |

---

## 🔐 Module Authentification

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| A-01 | Login (email/password → JWT) | ✅ | Controller + route + page frontend |
| A-02 | Register (B2C self-signup) | ✅ | Controller + route + page frontend |
| A-03 | Forgot Password | ✅ | Controller + route + page frontend |
| A-04 | Reset Password | ✅ | Controller + route + page frontend |
| A-05 | Refresh Token | ✅ | Interceptor Axios auto-refresh |
| A-06 | Join Company (invitation) | ✅ | Controller + route + page frontend |
| A-07 | Email Verification | ⏳ | Controller ready, flow frontend manquant |
| A-08 | SSO Google | ⏳ | Non commencé |
| A-09 | SSO Microsoft | ⏳ | Non commencé |

---

## 👑 Module Super Admin

### Backend (Controllers + Routes)

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| SA-B01 | Dashboard stats endpoint | ⏳ | Controller admin vide |
| SA-B02 | Companies CRUD endpoint | ⏳ | |
| SA-B03 | Plans CRUD endpoint | ⏳ | |
| SA-B04 | Transactions list + manual payment | ⏳ | |
| SA-B05 | Promo codes CRUD endpoint | ⏳ | |
| SA-B06 | Inventory management endpoint | ⏳ | |
| SA-B07 | Hardware orders endpoint | ⏳ | |
| SA-B08 | Batch generator endpoint | ⏳ | |
| SA-B09 | Operators CRUD endpoint | ⏳ | |
| SA-B10 | Audit logs endpoint | ⏳ | |
| SA-B11 | Admin routes registration | ⏳ | Pas de `admin.routes.ts` dans `routes/index.ts` |

### Frontend (Pages)

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| SA-F01 | Admin Dashboard page | ✅ | `admin/page.tsx` (16.5KB) |
| SA-F02 | Companies list + detail | ✅ | `admin/companies/` (3 fichiers) |
| SA-F03 | Plans page | ✅ | `admin/plans/page.tsx` |
| SA-F04 | Transactions page | ✅ | `admin/transactions/page.tsx` |
| SA-F05 | Promo codes page | ✅ | `admin/promo-codes/page.tsx` |
| SA-F06 | Inventory page | ✅ | `admin/inventory/page.tsx` |
| SA-F07 | Hardware orders page | ✅ | `admin/hardware-orders/page.tsx` |
| SA-F08 | Batch generator page | ✅ | `admin/batch-generator/page.tsx` |
| SA-F09 | Operators page | ✅ | `admin/operators/page.tsx` |
| SA-F10 | Audit logs page | ✅ | `admin/audit-logs/page.tsx` |
| SA-F11 | Connecter les pages aux vrais endpoints API | 🔴 | Dépend de SA-B01→B11 |

---

## 🏢 Module Company Admin

### Backend

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| CO-B01 | Dashboard endpoint | ✅ | `dashboard.controller.ts` |
| CO-B02 | Employees CRUD | ✅ | `employees.controller.ts` |
| CO-B03 | Departments CRUD | ✅ | `departments.controller.ts` |
| CO-B04 | Branding CRUD | ✅ | `branding.controller.ts` |
| CO-B05 | Leads list + export | ✅ | `leads.controller.ts` |
| CO-B06 | Billing / Subscription | ✅ | `billing.controller.ts` |
| CO-B07 | Hardware orders (company side) | ⏳ | |
| CO-B08 | Import CSV employees | ⏳ | |

### Frontend

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| CO-F01 | Company Dashboard page | ✅ | `company/dashboard/page.tsx` |
| CO-F02 | Employees page | ✅ | `company/employees/page.tsx` |
| CO-F03 | Groups (departments) page | ✅ | `company/groups/page.tsx` |
| CO-F04 | Branding page | ✅ | `company/branding/page.tsx` |
| CO-F05 | Leads page | ✅ | `company/leads/page.tsx` |
| CO-F06 | Lock settings page | ✅ | `company/lock/page.tsx` |
| CO-F07 | Subscription page | ✅ | `company/subscription/page.tsx` |
| CO-F08 | Wiring API calls aux vrais endpoints | ⏳ | Certaines pages encore en mock |

---

## 👤 Module Employee (User)

### Backend

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| US-B01 | User card CRUD (my card) | ✅ | `user.controller.ts` |
| US-B02 | Social links CRUD | ✅ | `socialLink` controller |
| US-B03 | User analytics | ✅ | Stats vues/scans/contacts |
| US-B04 | User contacts/leads | ✅ | Count + list |
| US-B05 | Physical card info | ✅ | Status pairing |
| US-B06 | Profile update | ✅ | Edit firstName, lastName, etc. |
| US-B07 | User routes registration | ✅ | `/api/user/` monté |

### Frontend

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| US-F01 | User dashboard layout | ✅ | Sidebar glassmorphism |
| US-F02 | Card editor page | ✅ | Live preview inclus |
| US-F03 | Social links manager | ✅ | 13 plateformes |
| US-F04 | My analytics page | ✅ | Bar chart 30j |
| US-F05 | Profile / card settings page | ✅ | |

---

## 🌐 Module Public

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| PU-01 | Public profile page `/p/:slug` | ✅ | Backend controller + frontend page |
| PU-02 | VCF download | ✅ | Route backend active |
| PU-03 | Contact exchange modal | ✅ | Formulaire + endpoint |
| PU-04 | Card activation router `/activate/:uid` | ✅ | `activation.controller.ts` + page 5 états |

---

## ⚙️ Module Opérateur

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| OP-01 | Pairing tool backend | ✅ | `operator.controller.ts` |
| OP-02 | Pairing tool frontend | ✅ | Page encode/pair/stats |
| OP-03 | Operator routes registration | ✅ | `/api/operator/` monté |

---

## 🔧 Technique / DevOps

| # | Tâche | Statut | Notes |
|---|-------|--------|-------|
| DV-01 | Stripe webhook handler | ⏳ | |
| DV-02 | SendGrid email templates | ⏳ | |
| DV-03 | S3 upload service | ⏳ | SDK installé, service non implémenté |
| DV-04 | CI/CD pipeline | ⏳ | |
| DV-05 | Docker / Production deploy | ⏳ | |
| DV-06 | Tests unitaires / E2E | ⏳ | Jest installé, 0 tests |
| DV-07 | Swagger / OpenAPI docs | ⏳ | |
