# 🏗️ AGENCE_TECH_STACK — KlikNode

> **Dernière MAJ** : 2026-02-20  
> **Version** : 1.0.0

---

## 📐 Architecture Générale

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│  Next.js 16 (App Router) · Tailwind 4 · shadcn/ui  │
│  Port: 3001                                        │
└──────────────────────┬──────────────────────────────┘
                       │ Axios (JWT Bearer)
                       ▼
┌─────────────────────────────────────────────────────┐
│                    BACKEND                          │
│  Express 4 · TypeScript · Prisma ORM                │
│  Port: 3000                                        │
└──────────────────────┬──────────────────────────────┘
                       │ Prisma Client
                       ▼
┌─────────────────────────────────────────────────────┐
│                  POSTGRESQL                         │
│  17 tables · 12 enums · UUID PKs                    │
└─────────────────────────────────────────────────────┘
```

---

## 🧩 Stack Frontend

| Catégorie | Technologie | Version |
|-----------|------------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| UI Library | React | 19.2.3 |
| Styling | Tailwind CSS | 4.x |
| Component Kit | shadcn/ui (Radix UI) | 1.4.3 |
| State Management | Zustand (persisted) | 5.0.11 |
| Data Fetching | TanStack React Query | 5.90.21 |
| Tables | TanStack React Table | 8.21.3 |
| Forms | React Hook Form + Zod | 7.71 / 4.3.6 |
| HTTP Client | Axios (interceptors) | 1.13.5 |
| Charts | Recharts | 3.7.0 |
| Icons | Lucide React + React Icons + Material Icons | - |
| Toasts | React Hot Toast | 2.6.0 |
| Animations | tw-animate-css | 1.4.0 |
| Utility | clsx + tailwind-merge + date-fns | - |

### Structure des Routes Frontend

```
app/
├── layout.tsx                    # Root layout (Toaster, fonts)
├── page.tsx                      # Landing page
├── globals.css                   # Design tokens (oklch, shadcn)
├── login/page.tsx
├── signup/page.tsx
├── forgot-password/page.tsx
├── reset-password/page.tsx
├── join/page.tsx                 # Accept company invitation
├── p/[slug]/page.tsx             # Public VCard profile
├── admin/
│   ├── page.tsx                  # Admin dashboard
│   ├── companies/                # CRUD entreprises
│   ├── plans/                    # Gestion plans
│   ├── transactions/             # Liste paiements
│   ├── promo-codes/              # Codes promo
│   ├── inventory/                # Stocks NFC
│   ├── hardware-orders/          # Commandes matériel
│   ├── batch-generator/          # Génération UIDs
│   ├── operators/                # Gestion opérateurs
│   └── audit-logs/               # Logs d'audit
└── company/
    ├── layout.tsx                # Company shell (sidebar)
    ├── page.tsx                  # Redirect
    ├── dashboard/                # Stats entreprise
    ├── employees/                # Gestion flotte
    ├── groups/                   # Départements
    ├── branding/                 # Branding entreprise
    ├── leads/                    # CRM / contacts
    ├── lock/                     # Master lock settings
    └── subscription/             # Abonnement
```

### Composants Réutilisables

```
components/
├── admin/
│   ├── AdminHeader.tsx
│   ├── AdminLayout.tsx
│   ├── AdminSidebar.tsx
│   ├── StatsCard.tsx
│   ├── StatusBadge.tsx
│   └── charts/
├── company/
│   ├── CompanyHeader.tsx
│   └── CompanySidebar.tsx
├── layout/                       # (vide pour l'instant)
└── ui/                           # shadcn components
```

---

## 🧩 Stack Backend

| Catégorie | Technologie | Version |
|-----------|------------|---------|
| Runtime | Node.js + TypeScript | 5.3.3 |
| Framework | Express | 4.18.2 |
| ORM | Prisma Client | 5.7.0 |
| Base de données | PostgreSQL | - |
| Auth | JWT (jsonwebtoken) + bcryptjs | 9.0.2 / 2.4.3 |
| Validation | Zod | 3.22.4 |
| File Upload | Multer | 1.4.5 |
| Email | SendGrid | 8.1.0 |
| Payment | Stripe | 14.8.0 |
| Storage | AWS S3 + Presigned URLs | 3.470.0 |
| QR Code | qrcode | 1.5.3 |
| PDF | pdf-lib | 1.17.1 |
| Wallet Pass | passkit-generator | 3.1.5 |
| GeoIP | geoip-lite | 1.4.7 |
| CSV | csv-parser + csv-stringify | - |
| Logging | Winston | 3.11.0 |
| Security | Helmet + CORS + Rate Limit | - |
| Dev | Nodemon + ts-node | - |

### Structure Backend

```
backend/src/
├── server.ts                     # Entry point Express
├── config/                       # Config files
├── controllers/
│   ├── auth/
│   │   └── auth.controller.ts    # ✅ Login, register, forgot, reset, refresh, join
│   ├── company/
│   │   ├── billing.controller.ts       # ✅ Subscription & invoices
│   │   ├── branding.controller.ts      # ✅ Company branding CRUD
│   │   ├── dashboard.controller.ts     # ✅ Company stats
│   │   ├── departments.controller.ts   # ✅ CRUD departments
│   │   ├── employees.controller.ts     # ✅ CRUD employees
│   │   └── leads.controller.ts         # ✅ Contact leads
│   ├── public/
│   │   └── card.controller.ts          # ✅ Public profile, VCF, exchange
│   └── admin/                          # ❌ VIDE — Aucun controller admin
├── routes/
│   ├── index.ts                  # auth + company + public
│   ├── auth.routes.ts
│   ├── company.routes.ts
│   └── public.routes.ts
├── middlewares/
│   ├── auth.middleware.ts        # JWT verification
│   ├── role.middleware.ts        # Role-based access
│   ├── error.middleware.ts       # Global error handler
│   ├── rate-limit.middleware.ts  # Rate limiting
│   └── validate.middleware.ts    # Zod validation
├── services/                     # (1 fichier)
├── utils/                        # Logger, helpers
├── validators/                   # Zod schemas
└── types/                        # TypeScript types
```

### Routes API montées

| Préfixe | Fichier | Status |
|---------|---------|--------|
| `/api/auth` | `auth.routes.ts` | ✅ Implémenté |
| `/api/company` | `company.routes.ts` | ✅ Implémenté |
| `/api/public` | `public.routes.ts` | ✅ Implémenté |
| `/api/admin` | — | ❌ Non implémenté |
| `/api/user` | — | ❌ Non implémenté |
| `/api/operator` | — | ❌ Non implémenté |

---

## 🗄️ Schéma de Base de Données (Prisma)

### Tables principales (17 models)

| Model | Table SQL | Description |
|-------|-----------|-------------|
| `User` | `users` | Utilisateurs (tous rôles) |
| `Company` | `companies` | Entreprises clientes |
| `SubscriptionPlan` | `subscription_plans` | Plans tarifaires |
| `Subscription` | `subscriptions` | Abonnements actifs |
| `Transaction` | `transactions` | Historique paiements |
| `PromoCode` | `promo_codes` | Codes promotionnels |
| `Card` | `cards` | Cartes digitales (1 par user) |
| `SocialLink` | `social_links` | Liens sociaux d'une carte |
| `PhysicalCard` | `physical_cards` | Cartes NFC physiques |
| `CardScan` | `card_scans` | Logs de scans/vues |
| `ContactLead` | `contacts_leads` | Contacts collectés |
| `Inventory` | `inventory` | Stocks par SKU/entrepôt |
| `HardwareOrder` | `hardware_orders` | Commandes de cartes |
| `Department` | `departments` | Départements |
| `UserDepartment` | `user_departments` | N:N user↔department |
| `CompanyBranding` | `company_branding` | Config branding |
| `AuditLog` | `audit_logs` | Journal d'audit |
| `RefreshToken` | `refresh_tokens` | Tokens de rafraîchissement |
| `PasswordReset` | `password_resets` | Tokens reset MDP |
| `CompanyInvitation` | `company_invitations` | Invitations |

### Enums (12)

`UserRole` (super_admin, company_admin, employee, operator) · `CountryCode` (FR, MA) · `Currency` (EUR, MAD) · `CompanyStatus` · `BillingPeriod` · `SubscriptionStatus` · `TransactionStatus` · `PaymentMethod` · `PhysicalCardStatus` · `Warehouse` (paris, casablanca) · `HardwareOrderStatus` · `CardTheme` · `DeviceType` · `ContactSource`

---

## 🔐 Authentification & Sécurité

- **JWT** : Access token (header `Authorization: Bearer`) + Refresh token
- **Stockage client** : `localStorage` (accessToken, refreshToken) + Cookie (`authToken`, `user` pour middleware Next.js)
- **Zustand** : Store persisté (`auth-storage`) pour `user` et `isAuthenticated`
- **Middleware Next.js** : RBAC côté client (redirection par rôle)
- **Middleware Express** : `authMiddleware` (JWT verify), `roleMiddleware` (rôles autorisés)
- **Rate limiting** : Login 5 req/min, global 100 req/min
- **Helmet** : Headers de sécurité
