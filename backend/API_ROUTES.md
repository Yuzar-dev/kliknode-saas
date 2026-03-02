# 🛣️ ARCHITECTURE DES ROUTES API - V-CARD SAAS

## 📋 BASE URL
```
Production: https://api.vcard.io
Development: http://localhost:3000
```

---

## 🔐 AUTHENTIFICATION

Toutes les routes (sauf `/public/*` et `/auth/*`) nécessitent un header:
```
Authorization: Bearer <JWT_TOKEN>
```

### Middlewares utilisés :
- `authMiddleware` → Vérifie le JWT
- `roleMiddleware(roles)` → Vérifie le rôle utilisateur
- `rateLimitMiddleware` → Protection contre brute force

---

## 🔑 `/api/auth/*` - Authentification (Public)

| Méthode | Route | Description | Body |
|---------|-------|-------------|------|
| `POST` | `/api/auth/login` | Connexion | `{email, password}` |
| `POST` | `/api/auth/register` | Inscription B2C | `{first_name, last_name, email, password}` |
| `POST` | `/api/auth/forgot-password` | Demande reset | `{email}` |
| `POST` | `/api/auth/reset-password` | Reset MDP | `{token, password}` |
| `POST` | `/api/auth/refresh-token` | Rafraîchir JWT | `{refresh_token}` |
| `POST` | `/api/auth/verify-email` | Vérifier email | `{token}` |
| `POST` | `/api/auth/join-company` | Accepter invitation | `{token, password}` |
| `GET` | `/api/auth/sso/google` | Connexion Google | - |
| `GET` | `/api/auth/sso/microsoft` | Connexion Microsoft | - |

**Rate Limit** : 5 requêtes / minute sur `/login` et `/register`

---

## 👑 `/api/admin/*` - SUPER ADMIN

**Middleware** : `roleMiddleware(['super_admin'])`

### Dashboard

| Méthode | Route | Description | Response |
|---------|-------|-------------|----------|
| `GET` | `/api/admin/dashboard/stats` | Statistiques globales | `{mrr, arr, churn_rate, active_users, ...}` |
| `GET` | `/api/admin/dashboard/activity-feed` | Logs récents | `[{type, message, timestamp}]` |

### Gestion Commerciale

| Méthode | Route | Description | Body/Params |
|---------|-------|-------------|-------------|
| `GET` | `/api/admin/companies` | Liste entreprises | Query: `?status=active&country=FR&page=1&limit=20` |
| `GET` | `/api/admin/companies/:id` | Détail entreprise | - |
| `POST` | `/api/admin/companies` | Créer entreprise | `{name, ice, siret, country, admin_email, ...}` |
| `PUT` | `/api/admin/companies/:id` | Modifier entreprise | `{name, status, ...}` |
| `POST` | `/api/admin/companies/:id/suspend` | Suspendre | `{reason}` |
| `POST` | `/api/admin/companies/:id/impersonate` | Se connecter en tant que | - |
| `GET` | `/api/admin/companies/:id/employees` | Liste employés entreprise | - |
| `POST` | `/api/admin/companies/:id/add-licenses` | Ajouter licences | `{quantity}` |
| `POST` | `/api/admin/companies/:id/offer-free-month` | Offrir 1 mois | - |

### Finance & Plans

| Méthode | Route | Description | Body/Params |
|---------|-------|-------------|-------------|
| `GET` | `/api/admin/plans` | Liste plans | - |
| `GET` | `/api/admin/plans/:id` | Détail plan | - |
| `POST` | `/api/admin/plans` | Créer plan | `{name, price_eur, price_mad, features, ...}` |
| `PUT` | `/api/admin/plans/:id` | Modifier plan | `{price_eur, features, ...}` |
| `DELETE` | `/api/admin/plans/:id` | Archiver plan | - |
| `GET` | `/api/admin/transactions` | Liste paiements | Query: `?status=succeeded&page=1` |
| `GET` | `/api/admin/transactions/:id` | Détail transaction | - |
| `POST` | `/api/admin/transactions/manual` | Paiement manuel | `{company_id, amount, currency, notes}` |
| `POST` | `/api/admin/transactions/:id/mark-paid` | Marquer payé | - |
| `GET` | `/api/admin/promo-codes` | Liste codes promo | - |
| `POST` | `/api/admin/promo-codes` | Créer code promo | `{code, discount_percent, max_uses, ...}` |
| `PUT` | `/api/admin/promo-codes/:id` | Modifier code promo | - |
| `DELETE` | `/api/admin/promo-codes/:id` | Désactiver code | - |

### Logistique & Matériel

| Méthode | Route | Description | Body/Params |
|---------|-------|-------------|-------------|
| `GET` | `/api/admin/inventory` | Stocks | Query: `?warehouse=paris` |
| `POST` | `/api/admin/inventory/adjust` | Ajuster stock | `{sku, warehouse, quantity, reason}` |
| `POST` | `/api/admin/inventory/transfer` | Transférer | `{sku, from_warehouse, to_warehouse, quantity}` |
| `GET` | `/api/admin/hardware-orders` | Liste commandes | Query: `?status=pending` |
| `GET` | `/api/admin/hardware-orders/:id` | Détail commande | - |
| `PUT` | `/api/admin/hardware-orders/:id` | MAJ commande | `{status, tracking_number}` |
| `POST` | `/api/admin/batch-generator` | Générer UIDs | `{quantity, chip_type, tag}` |
| `GET` | `/api/admin/batch-generator/:id/download` | Download CSV | - |

### Système & Sécurité

| Méthode | Route | Description | Body/Params |
|---------|-------|-------------|-------------|
| `GET` | `/api/admin/operators` | Liste opérateurs | - |
| `POST` | `/api/admin/operators` | Créer opérateur | `{email, warehouse, ...}` |
| `PUT` | `/api/admin/operators/:id` | Modifier opérateur | - |
| `DELETE` | `/api/admin/operators/:id` | Révoquer accès | - |
| `GET` | `/api/admin/audit-logs` | Audit logs | Query: `?user_id=...&action=...&page=1` |
| `GET` | `/api/admin/system/maintenance` | Statut maintenance | - |
| `POST` | `/api/admin/system/maintenance` | Toggle maintenance | `{enabled: true}` |

---

## 🏢 `/api/company/*` - COMPANY ADMIN & EMPLOYEES

**Middleware** : `roleMiddleware(['company_admin', 'employee'])`

### Dashboard

| Méthode | Route | Description | Response |
|---------|-------|-------------|----------|
| `GET` | `/api/company/dashboard` | Stats entreprise | `{active_cards, scans_this_month, top_employees}` |

### Flotte (Employés)

**Restriction** : `company_admin` uniquement

| Méthode | Route | Description | Body/Params |
|---------|-------|-------------|-------------|
| `GET` | `/api/company/employees` | Annuaire | Query: `?department_id=...&search=...` |
| `GET` | `/api/company/employees/:id` | Détail employé | - |
| `POST` | `/api/company/employees` | Ajouter employé | `{first_name, last_name, email, job_title, ...}` |
| `POST` | `/api/company/employees/import` | Import CSV | `{file: <multipart>}` |
| `PUT` | `/api/company/employees/:id` | Modifier employé | `{job_title, ...}` |
| `POST` | `/api/company/employees/:id/deactivate` | Désactiver carte | - |
| `POST` | `/api/company/employees/:id/reset-password` | Reset MDP | - |
| `DELETE` | `/api/company/employees/:id` | Supprimer (soft) | - |

### Départements

| Méthode | Route | Description | Body/Params |
|---------|-------|-------------|-------------|
| `GET` | `/api/company/departments` | Liste | - |
| `POST` | `/api/company/departments` | Créer | `{name}` |
| `PUT` | `/api/company/departments/:id` | Modifier | `{name}` |
| `DELETE` | `/api/company/departments/:id` | Supprimer | - |
| `POST` | `/api/company/departments/:id/assign-users` | Assigner users | `{user_ids: []}` |

### Branding

| Méthode | Route | Description | Body/Params |
|---------|-------|-------------|-------------|
| `GET` | `/api/company/branding` | Config branding | - |
| `PUT` | `/api/company/branding` | MAJ branding | `{logo_light_url, primary_color, ...}` |
| `POST` | `/api/company/branding/upload-logo` | Upload logo | `{file: <multipart>}` |
| `PUT` | `/api/company/branding/lock` | Master Lock | `{lock_photo, lock_job_title, force_logo}` |

### Leads (CRM)

| Méthode | Route | Description | Body/Params |
|---------|-------|-------------|-------------|
| `GET` | `/api/company/leads` | Tous les contacts | Query: `?employee_id=...&from=...&to=...` |
| `GET` | `/api/company/leads/export` | Export Excel | - |
| `POST` | `/api/company/leads/sync-crm` | Sync CRM externe | `{crm_type: 'hubspot', api_key}` |

### Facturation

| Méthode | Route | Description | Body/Params |
|---------|-------|-------------|-------------|
| `GET` | `/api/company/subscription` | Abonnement actuel | - |
| `POST` | `/api/company/subscription/payment-method` | Ajouter CB | `{stripe_payment_method_id}` |
| `GET` | `/api/company/invoices` | Historique factures | - |
| `GET` | `/api/company/invoices/:id/download` | Download PDF | - |
| `POST` | `/api/company/subscription/upgrade` | Changer plan | `{plan_id}` |
| `POST` | `/api/company/subscription/cancel` | Annuler | - |

### Commandes Hardware (E-shop)

| Méthode | Route | Description | Body/Params |
|---------|-------|-------------|-------------|
| `POST` | `/api/company/hardware-orders` | Commander cartes | `{quantity, shipping_address}` |
| `GET` | `/api/company/hardware-orders` | Mes commandes | - |
| `GET` | `/api/company/hardware-orders/:id` | Suivi commande | - |

---

## 👤 `/api/user/*` - UTILISATEUR FINAL

**Middleware** : `authMiddleware`

### Ma Carte

| Méthode | Route | Description | Body/Params |
|---------|-------|-------------|-------------|
| `GET` | `/api/user/card` | Ma carte complète | - |
| `PUT` | `/api/user/card` | MAJ carte | `{first_name, bio, phone_mobile, ...}` |
| `POST` | `/api/user/card/upload-avatar` | Upload photo | `{file: <multipart>}` |
| `POST` | `/api/user/card/upload-cover` | Upload cover | `{file: <multipart>}` |
| `DELETE` | `/api/user/card/avatar` | Supprimer photo | - |
| `PUT` | `/api/user/card/theme` | Changer thème | `{theme: 'dark', primary_color}` |
| `GET` | `/api/user/card/analytics` | Stats perso | `{view_count, clicks, top_links}` |
| `POST` | `/api/user/card/generate-qr` | Générer QR | - |
| `POST` | `/api/user/card/generate-wallet-pass` | Apple/Google Wallet | `{platform: 'apple'}` |

### Liens Sociaux

| Méthode | Route | Description | Body/Params |
|---------|-------|-------------|-------------|
| `GET` | `/api/user/social-links` | Liste liens | - |
| `POST` | `/api/user/social-links` | Ajouter lien | `{platform, url, label, icon}` |
| `PUT` | `/api/user/social-links/:id` | Modifier lien | - |
| `PUT` | `/api/user/social-links/reorder` | Drag & drop | `{orders: [{id, order}]}` |
| `DELETE` | `/api/user/social-links/:id` | Supprimer lien | - |

### Contacts Leads

| Méthode | Route | Description | Body/Params |
|---------|-------|-------------|-------------|
| `GET` | `/api/user/contacts` | Mes leads | Query: `?from=...&to=...` |
| `GET` | `/api/user/contacts/:id` | Détail lead | - |
| `GET` | `/api/user/contacts/export-vcf` | Export .vcf | - |
| `GET` | `/api/user/contacts/export-excel` | Export Excel | - |

### Carte Physique

| Méthode | Route | Description | Body/Params |
|---------|-------|-------------|-------------|
| `GET` | `/api/user/physical-card` | Carte liée | - |
| `POST` | `/api/user/physical-card/report-lost` | Déclarer perdue | - |

### Profil & Paramètres

| Méthode | Route | Description | Body/Params |
|---------|-------|-------------|-------------|
| `GET` | `/api/user/profile` | Mon profil | - |
| `PUT` | `/api/user/profile` | MAJ profil | `{email, language}` |
| `PUT` | `/api/user/profile/password` | Changer MDP | `{old_password, new_password}` |
| `DELETE` | `/api/user/account` | Supprimer compte | - |

---

## 📦 `/api/operator/*` - OPÉRATEUR LOGISTIQUE

**Middleware** : `roleMiddleware(['operator'])`

### Pairing Tool

| Méthode | Route | Description | Body/Params |
|---------|-------|-------------|-------------|
| `GET` | `/api/operator/companies/search` | Recherche entreprise | Query: `?q=tesla` |
| `POST` | `/api/operator/pairing/scan-card` | Scanner UID | `{uid, company_id}` |
| `GET` | `/api/operator/pairing/session` | Session en cours | - |
| `POST` | `/api/operator/pairing/validate-batch` | Valider lot | `{session_id}` |
| `POST` | `/api/operator/pairing/cancel-session` | Annuler session | - |

---

## 🌐 `/api/public/*` - PAGES PUBLIQUES

**Pas d'authentification**

### Profil Public

| Méthode | Route | Description | Response |
|---------|-------|-------------|----------|
| `GET` | `/api/public/profile/:slug` | Page publique | `{first_name, job_title, social_links, ...}` |
| `POST` | `/api/public/profile/:slug/view` | Logger vue | `{ip, user_agent}` |
| `POST` | `/api/public/profile/:slug/exchange-contact` | Laisser contact | `{first_name, last_name, email, phone, notes}` |
| `GET` | `/api/public/profile/:slug/vcard` | Download .vcf | - |

### Activation Carte (Routeur Intelligent)

| Méthode | Route | Description | Response |
|---------|-------|-------------|----------|
| `GET` | `/api/public/activate/:uid` | Vérifier UID | `{status, redirect_to, company_name}` |

**Statuts possibles** :
- `not_found` → Carte inexistante
- `in_stock` → Pas encore pairée → Redirect: `/admin` ou `/operator`
- `paired_no_user` → Pairée mais user pas créé → Redirect: `/join/:token`
- `paired_with_user` → User existe → Redirect: `/login`
- `lost` → Carte déclarée perdue → Erreur

---

## ⚙️ `/api/system/*` - ROUTES TECHNIQUES

### Webhooks

| Méthode | Route | Description | Body |
|---------|-------|-------------|------|
| `POST` | `/api/webhooks/stripe` | Stripe events | Stripe signature |
| `POST` | `/api/webhooks/sendgrid` | Email events | SendGrid payload |

### Health & Status

| Méthode | Route | Description | Response |
|---------|-------|-------------|----------|
| `GET` | `/api/health` | Health check | `{status: 'ok', version}` |
| `GET` | `/api/status` | Statut système | `{database, redis, s3}` |

---

## 📊 RÉSUMÉ DES ENDPOINTS

| Espace | Nombre d'endpoints |
|--------|-------------------|
| Auth | 9 |
| Admin | 45 |
| Company | 35 |
| User | 22 |
| Operator | 5 |
| Public | 5 |
| System | 4 |
| **TOTAL** | **125 endpoints** |

---

## 🔒 PERMISSIONS PAR RÔLE

### `super_admin`
- ✅ Accès total à `/api/admin/*`
- ✅ Peut impersonate n'importe quel user
- ✅ Peut modifier n'importe quelle donnée

### `company_admin`
- ✅ Accès total à `/api/company/*`
- ✅ Peut gérer ses employés
- ✅ Peut voir les leads de tous ses employés
- ❌ Ne peut pas accéder aux autres entreprises

### `employee`
- ✅ Accès à `/api/user/*` (ses données uniquement)
- ✅ Peut voir les leads de son entreprise en lecture seule
- ❌ Ne peut pas gérer d'autres employés

### `operator`
- ✅ Accès à `/api/operator/*`
- ✅ Peut pairer des cartes
- ❌ Ne peut rien modifier d'autre

---

## 🛡️ MIDDLEWARES

### 1. `authMiddleware`
```javascript
// Vérifie le JWT dans le header Authorization
// Ajoute req.user = {id, email, role, company_id}
```

### 2. `roleMiddleware(allowedRoles)`
```javascript
// Vérifie si req.user.role est dans allowedRoles
// Retourne 403 Forbidden sinon
```

### 3. `rateLimitMiddleware`
```javascript
// Login: 5 req/min
// Signup: 3 req/min
// API générale: 100 req/min
```

### 4. `validateMiddleware(schema)`
```javascript
// Validation Zod/Joi des inputs
// Retourne 400 Bad Request si invalide
```

### 5. `uploadMiddleware`
```javascript
// Multer pour uploads fichiers
// Limite: 5MB pour images
// Types: .jpg, .png, .webp
```

---

## 📄 EXEMPLES DE RESPONSES

### Success (200/201)
```json
{
  "success": true,
  "data": {
    // ...
  }
}
```

### Error (400/401/403/404/500)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email ou mot de passe incorrect",
    "details": {}
  }
}
```

### Pagination
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "total_pages": 8
  }
}
```

---

✅ **Architecture API complète prête !**
