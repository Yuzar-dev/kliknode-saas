# 📊 SCHÉMA DE BASE DE DONNÉES COMPLET - V-CARD SAAS

## 🎯 RÈGLES MÉTIER CRITIQUES

- **Multi-pays** : Toutes les tables monétaires ont `price_eur` et `price_mad`
- **Soft Delete** : `deleted_at` sur users, cards, companies
- **Traçabilité** : Toutes actions sensibles dans `audit_logs`
- **Timestamps** : `created_at`, `updated_at` sur TOUTES les tables

---

## 📋 TABLES PRINCIPALES

### 1️⃣ **users** (Utilisateurs multi-rôles)

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL |
| `password_hash` | VARCHAR(255) | NOT NULL (bcrypt) |
| `first_name` | VARCHAR(100) | |
| `last_name` | VARCHAR(100) | |
| `role` | ENUM | `super_admin`, `company_admin`, `employee`, `operator` |
| `company_id` | UUID | FK → companies (NULL pour super_admin/operator) |
| `phone` | VARCHAR(20) | |
| `language` | VARCHAR(2) | `fr`, `en` (défaut: `fr`) |
| `avatar_url` | TEXT | URL S3/R2 |
| `is_active` | BOOLEAN | Défaut: TRUE |
| `last_login_at` | TIMESTAMP | |
| `email_verified_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |
| `deleted_at` | TIMESTAMP | Soft delete |

**Index** :
- `idx_users_email` sur `email`
- `idx_users_company` sur `company_id`
- `idx_users_role` sur `role`

---

### 2️⃣ **companies** (Entreprises B2B)

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `name` | VARCHAR(255) | NOT NULL |
| `slug` | VARCHAR(255) | UNIQUE (pour URL /company/tesla) |
| `ice` | VARCHAR(50) | Numéro ICE (Maroc) |
| `siret` | VARCHAR(50) | Numéro SIRET (France) |
| `country` | ENUM | `FR`, `MA` |
| `currency` | ENUM | `EUR`, `MAD` |
| `domain` | VARCHAR(255) | ex: @tesla.com (pour vérif email) |
| `address` | TEXT | |
| `city` | VARCHAR(100) | |
| `postal_code` | VARCHAR(20) | |
| `phone` | VARCHAR(20) | |
| `admin_email` | VARCHAR(255) | Contact principal |
| `status` | ENUM | `active`, `suspended`, `trial` |
| `trial_ends_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |
| `deleted_at` | TIMESTAMP | |

**Index** :
- `idx_companies_slug` sur `slug`
- `idx_companies_status` sur `status`

---

### 3️⃣ **subscription_plans** (Plans d'abonnement)

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `name` | VARCHAR(100) | ex: "Pro Monthly", "Business Corp" |
| `slug` | VARCHAR(100) | ex: "pro-monthly" |
| `price_eur` | DECIMAL(10,2) | Prix en Euros |
| `price_mad` | DECIMAL(10,2) | Prix en Dirhams |
| `billing_period` | ENUM | `monthly`, `yearly`, `lifetime` |
| `max_licenses` | INTEGER | Nombre max d'employés (-1 = illimité) |
| `features` | JSON | {"custom_domain": true, "api_access": false} |
| `is_active` | BOOLEAN | Défaut: TRUE |
| `stripe_price_id_eur` | VARCHAR(255) | ID Stripe pour EUR |
| `stripe_price_id_mad` | VARCHAR(255) | ID Stripe pour MAD (si applicable) |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

---

### 4️⃣ **subscriptions** (Abonnements actifs)

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `company_id` | UUID | FK → companies |
| `plan_id` | UUID | FK → subscription_plans |
| `status` | ENUM | `active`, `cancelled`, `past_due`, `trialing` |
| `current_period_start` | TIMESTAMP | |
| `current_period_end` | TIMESTAMP | |
| `cancel_at` | TIMESTAMP | Date annulation planifiée |
| `stripe_subscription_id` | VARCHAR(255) | ID Stripe |
| `payment_method` | ENUM | `stripe_auto`, `manual_transfer` |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Index** :
- `idx_subscriptions_company` sur `company_id`
- `idx_subscriptions_status` sur `status`

---

### 5️⃣ **transactions** (Historique paiements)

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `company_id` | UUID | FK → companies |
| `subscription_id` | UUID | FK → subscriptions (nullable) |
| `amount` | DECIMAL(10,2) | Montant payé |
| `currency` | ENUM | `EUR`, `MAD` |
| `status` | ENUM | `succeeded`, `failed`, `refunded`, `pending` |
| `payment_method` | ENUM | `stripe`, `manual_transfer`, `promo` |
| `stripe_payment_intent_id` | VARCHAR(255) | |
| `invoice_number` | VARCHAR(50) | Généré auto (INV-2025-001) |
| `invoice_pdf_url` | TEXT | URL du PDF facture |
| `notes` | TEXT | Pour virement manuel |
| `processed_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | |

**Index** :
- `idx_transactions_company` sur `company_id`
- `idx_transactions_status` sur `status`

---

### 6️⃣ **promo_codes** (Codes promo)

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `code` | VARCHAR(50) | UNIQUE (ex: WELCOME20) |
| `discount_percent` | INTEGER | 0-100 |
| `discount_amount_eur` | DECIMAL(10,2) | Réduction fixe EUR |
| `discount_amount_mad` | DECIMAL(10,2) | Réduction fixe MAD |
| `max_uses` | INTEGER | (-1 = illimité) |
| `used_count` | INTEGER | Défaut: 0 |
| `valid_from` | TIMESTAMP | |
| `valid_until` | TIMESTAMP | |
| `is_active` | BOOLEAN | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

---

### 7️⃣ **cards** (Cartes de visite virtuelles)

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → users, UNIQUE |
| `public_slug` | VARCHAR(100) | UNIQUE (pour /p/john-doe) |
| `first_name` | VARCHAR(100) | |
| `last_name` | VARCHAR(100) | |
| `job_title` | VARCHAR(150) | |
| `company_name` | VARCHAR(255) | |
| `bio` | TEXT | |
| `avatar_url` | TEXT | |
| `cover_url` | TEXT | |
| `phone_mobile` | VARCHAR(20) | |
| `phone_office` | VARCHAR(20) | |
| `email` | VARCHAR(255) | |
| `website` | VARCHAR(255) | |
| `address` | TEXT | |
| `city` | VARCHAR(100) | |
| `country` | VARCHAR(100) | |
| `theme` | ENUM | `light`, `dark` |
| `primary_color` | VARCHAR(7) | Hex color (#FF0000) |
| `is_public` | BOOLEAN | Défaut: TRUE |
| `view_count` | INTEGER | Défaut: 0 |
| `qr_code_url` | TEXT | QR Code généré |
| `wallet_pass_url` | TEXT | Apple Wallet / Google Pay |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |
| `deleted_at` | TIMESTAMP | |

**Index** :
- `idx_cards_user` sur `user_id`
- `idx_cards_slug` sur `public_slug`

---

### 8️⃣ **social_links** (Liens sociaux des cartes)

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `card_id` | UUID | FK → cards |
| `platform` | VARCHAR(50) | `linkedin`, `whatsapp`, `instagram`, etc. |
| `url` | TEXT | |
| `label` | VARCHAR(100) | Texte affiché |
| `icon` | VARCHAR(50) | Nom de l'icône |
| `order` | INTEGER | Position (drag & drop) |
| `is_active` | BOOLEAN | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

---

### 9️⃣ **physical_cards** (Cartes NFC physiques)

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `uid` | VARCHAR(100) | UNIQUE, NOT NULL (UID puce NFC) |
| `sku` | VARCHAR(50) | Référence produit |
| `batch_tag` | VARCHAR(100) | Tag du lot (Prod-Oct-2025) |
| `status` | ENUM | `in_stock`, `reserved`, `paired`, `lost` |
| `warehouse` | ENUM | `paris`, `casablanca` |
| `paired_card_id` | UUID | FK → cards (NULL si non pairé) |
| `paired_at` | TIMESTAMP | |
| `paired_by_operator_id` | UUID | FK → users (opérateur) |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Index** :
- `idx_physical_uid` sur `uid`
- `idx_physical_status` sur `status`
- `idx_physical_warehouse` sur `warehouse`

---

### 🔟 **card_scans** (Analytics scans)

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `card_id` | UUID | FK → cards |
| `scanned_at` | TIMESTAMP | |
| `ip_address` | VARCHAR(45) | IPv4/IPv6 |
| `user_agent` | TEXT | |
| `country` | VARCHAR(2) | Code pays (via GeoIP) |
| `city` | VARCHAR(100) | |
| `referrer` | TEXT | |
| `device_type` | ENUM | `mobile`, `desktop`, `tablet` |

**Index** :
- `idx_scans_card` sur `card_id`
- `idx_scans_date` sur `scanned_at`

---

### 1️⃣1️⃣ **contacts_leads** (Contacts récupérés)

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `card_id` | UUID | FK → cards (qui a reçu le contact) |
| `user_id` | UUID | FK → users (propriétaire de la carte) |
| `company_id` | UUID | FK → companies (pour aggrégation CRM) |
| `first_name` | VARCHAR(100) | |
| `last_name` | VARCHAR(100) | |
| `email` | VARCHAR(255) | |
| `phone` | VARCHAR(20) | |
| `company_name` | VARCHAR(255) | |
| `notes` | TEXT | Message du visiteur |
| `source` | VARCHAR(50) | `qr_scan`, `nfc_tap`, `web_link` |
| `created_at` | TIMESTAMP | |

**Index** :
- `idx_leads_user` sur `user_id`
- `idx_leads_company` sur `company_id`

---

### 1️⃣2️⃣ **inventory** (Stocks entrepôt)

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `sku` | VARCHAR(50) | Référence produit |
| `warehouse` | ENUM | `paris`, `casablanca` |
| `quantity_physical` | INTEGER | Stock réel |
| `quantity_reserved` | INTEGER | Réservé (commandes en cours) |
| `quantity_available` | INTEGER | Computed: physical - reserved |
| `last_adjustment_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Index** :
- `idx_inventory_sku_warehouse` sur `(sku, warehouse)` UNIQUE

---

### 1️⃣3️⃣ **hardware_orders** (Commandes cartes physiques)

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `company_id` | UUID | FK → companies |
| `order_number` | VARCHAR(50) | ex: ORD-2025-001 |
| `quantity` | INTEGER | |
| `status` | ENUM | `pending`, `processing`, `shipped`, `delivered` |
| `warehouse` | ENUM | `paris`, `casablanca` |
| `shipping_address` | TEXT | |
| `tracking_number` | VARCHAR(100) | |
| `shipped_at` | TIMESTAMP | |
| `delivered_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

---

### 1️⃣4️⃣ **audit_logs** (Traçabilité)

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → users (qui a fait l'action) |
| `action` | VARCHAR(100) | ex: `company.suspended`, `user.created` |
| `entity_type` | VARCHAR(50) | `Company`, `User`, `Card` |
| `entity_id` | UUID | ID de l'entité modifiée |
| `changes` | JSON | Ancien/nouveau état |
| `ip_address` | VARCHAR(45) | |
| `user_agent` | TEXT | |
| `created_at` | TIMESTAMP | |

**Index** :
- `idx_audit_user` sur `user_id`
- `idx_audit_action` sur `action`
- `idx_audit_date` sur `created_at`

---

### 1️⃣5️⃣ **departments** (Groupes dans entreprises)

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `company_id` | UUID | FK → companies |
| `name` | VARCHAR(100) | ex: "Sales", "Marketing" |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

---

### 1️⃣6️⃣ **user_departments** (Relation many-to-many)

| Colonne | Type | Description |
|---------|------|-------------|
| `user_id` | UUID | FK → users |
| `department_id` | UUID | FK → departments |
| `created_at` | TIMESTAMP | |

**Index** :
- PK composite sur `(user_id, department_id)`

---

### 1️⃣7️⃣ **company_branding** (Identité visuelle entreprise)

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `company_id` | UUID | FK → companies, UNIQUE |
| `logo_light_url` | TEXT | |
| `logo_dark_url` | TEXT | |
| `primary_color` | VARCHAR(7) | Hex |
| `font_family` | VARCHAR(100) | |
| `lock_photo` | BOOLEAN | Empêcher modif photo |
| `lock_job_title` | BOOLEAN | Empêcher modif poste |
| `force_logo` | BOOLEAN | Forcer logo entreprise |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

---

### 1️⃣8️⃣ **refresh_tokens** (JWT refresh tokens)

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → users |
| `token` | VARCHAR(500) | Token haché |
| `expires_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | |
| `revoked_at` | TIMESTAMP | |

**Index** :
- `idx_refresh_tokens_user` sur `user_id`

---

### 1️⃣9️⃣ **password_resets** (Réinitialisation mot de passe)

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `email` | VARCHAR(255) | |
| `token` | VARCHAR(255) | Token haché |
| `expires_at` | TIMESTAMP | |
| `used_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | |

---

### 2️⃣0️⃣ **company_invitations** (Invitations employés)

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | PK |
| `company_id` | UUID | FK → companies |
| `email` | VARCHAR(255) | |
| `token` | VARCHAR(255) | UNIQUE |
| `invited_by_user_id` | UUID | FK → users |
| `expires_at` | TIMESTAMP | |
| `accepted_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | |

---

## 🔗 RELATIONS CLÉS

```
companies (1) ←→ (N) users
companies (1) ←→ (1) subscriptions
companies (1) ←→ (N) transactions
companies (1) ←→ (1) company_branding
companies (1) ←→ (N) departments
companies (1) ←→ (N) hardware_orders

users (1) ←→ (1) cards
users (N) ←→ (N) departments (via user_departments)

cards (1) ←→ (N) social_links
cards (1) ←→ (1) physical_cards (nullable)
cards (1) ←→ (N) card_scans
cards (1) ←→ (N) contacts_leads

subscriptions (N) ←→ (1) subscription_plans

physical_cards (N) ←→ (1) inventory (via SKU + warehouse)
```

---

## 📊 TOTAL : 20 TABLES

✅ **Schéma prêt pour migration SQL/Prisma**
