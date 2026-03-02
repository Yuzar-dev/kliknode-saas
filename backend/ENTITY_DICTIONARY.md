# 📚 DICTIONNAIRE DES ENTITÉS - V-CARD SAAS

## 🎯 ENTITÉS PRINCIPALES

### 1. **User** (Utilisateur)
Représente tout utilisateur de la plateforme (admin, company admin, employé, opérateur)

**Champs clés** :
- `id`, `email`, `password_hash`
- `first_name`, `last_name`, `phone`
- `role`: `super_admin` | `company_admin` | `employee` | `operator`
- `company_id`: Entreprise de rattachement (NULL pour super_admin/operator)
- `language`: `fr` | `en`
- `is_active`, `deleted_at` (soft delete)

**Relations** :
- Appartient à 1 `Company` (nullable)
- Possède 1 `Card` (virtuelle)
- Peut être dans plusieurs `Department`

---

### 2. **Company** (Entreprise B2B)
Entreprise cliente du SaaS

**Champs clés** :
- `id`, `name`, `slug`
- `ice` (Maroc), `siret` (France)
- `country`: `FR` | `MA`
- `currency`: `EUR` | `MAD`
- `domain`: ex `@tesla.com` (pour validation email employés)
- `status`: `active` | `suspended` | `trial`

**Relations** :
- Possède plusieurs `User` (employés)
- Possède 1 `Subscription` (abonnement actif)
- Possède 1 `CompanyBranding`
- Possède plusieurs `Department`
- Possède plusieurs `Transaction`

---

### 3. **Card** (Carte de visite virtuelle)
La carte digitale de chaque utilisateur

**Champs clés** :
- `id`, `user_id` (UNIQUE)
- `public_slug`: ex `john-doe` (pour URL /p/john-doe)
- `first_name`, `last_name`, `job_title`, `bio`
- `avatar_url`, `cover_url`
- `phone_mobile`, `phone_office`, `email`, `website`
- `theme`: `light` | `dark`
- `primary_color`: Hex (#FF0000)
- `view_count`: Analytics
- `qr_code_url`, `wallet_pass_url`

**Relations** :
- Appartient à 1 `User`
- Peut être liée à 1 `PhysicalCard` (NFC)
- Possède plusieurs `SocialLink`
- Possède plusieurs `CardScan` (analytics)
- Possède plusieurs `ContactLead`

---

### 4. **PhysicalCard** (Carte NFC physique)
Carte matérielle avec puce NFC

**Champs clés** :
- `id`, `uid` (UNIQUE - identifiant puce NFC)
- `sku`: Référence produit
- `batch_tag`: ex `Prod-Oct-2025`
- `status`: `in_stock` | `reserved` | `paired` | `lost`
- `warehouse`: `paris` | `casablanca`
- `paired_card_id`: Lien vers `Card` (NULL si non pairée)
- `paired_at`, `paired_by_operator_id`

**Relations** :
- Peut être liée à 1 `Card`
- Pairée par 1 `User` (opérateur)

---

### 5. **SocialLink** (Lien social / Réseau)
Liens sociaux affichés sur la carte

**Champs clés** :
- `id`, `card_id`
- `platform`: `linkedin`, `whatsapp`, `instagram`, `pdf`, `calendly`, etc.
- `url`, `label`
- `icon`: Nom de l'icône
- `order`: Position (drag & drop)

**Relations** :
- Appartient à 1 `Card`

---

### 6. **SubscriptionPlan** (Plan d'abonnement)
Plans tarifaires (Free, Pro, Business, etc.)

**Champs clés** :
- `id`, `name`, `slug`
- `price_eur`, `price_mad`
- `billing_period`: `monthly` | `yearly` | `lifetime`
- `max_licenses`: Nb max employés (-1 = illimité)
- `features`: JSON (ex: `{"api_access": true, "custom_domain": false}`)
- `stripe_price_id_eur`, `stripe_price_id_mad`

**Relations** :
- Plusieurs `Subscription` peuvent pointer vers ce plan

---

### 7. **Subscription** (Abonnement actif)
Abonnement d'une entreprise à un plan

**Champs clés** :
- `id`, `company_id`, `plan_id`
- `status`: `active` | `cancelled` | `past_due` | `trialing`
- `current_period_start`, `current_period_end`
- `cancel_at`: Date annulation planifiée
- `stripe_subscription_id`
- `payment_method`: `stripe_auto` | `manual_transfer`

**Relations** :
- Appartient à 1 `Company`
- Pointe vers 1 `SubscriptionPlan`

---

### 8. **Transaction** (Paiement)
Historique des paiements (Stripe + manuels)

**Champs clés** :
- `id`, `company_id`, `subscription_id`
- `amount`, `currency` (`EUR` | `MAD`)
- `status`: `succeeded` | `failed` | `refunded` | `pending`
- `payment_method`: `stripe` | `manual_transfer` | `promo`
- `stripe_payment_intent_id`
- `invoice_number`: ex `INV-2025-001`
- `invoice_pdf_url`
- `notes`: Pour virements manuels

**Relations** :
- Appartient à 1 `Company`
- Peut être liée à 1 `Subscription`

---

### 9. **PromoCode** (Code promo)
Coupons de réduction

**Champs clés** :
- `id`, `code` (ex: `WELCOME20`)
- `discount_percent`: 0-100
- `discount_amount_eur`, `discount_amount_mad`
- `max_uses`, `used_count`
- `valid_from`, `valid_until`

---

### 10. **ContactLead** (Contact récupéré)
Contact laissé par un visiteur sur une carte publique

**Champs clés** :
- `id`, `card_id`, `user_id`, `company_id`
- `first_name`, `last_name`, `email`, `phone`
- `company_name`, `notes`
- `source`: `qr_scan` | `nfc_tap` | `web_link`

**Relations** :
- Appartient à 1 `Card` (carte qui l'a reçu)
- Appartient à 1 `User` (propriétaire)
- Appartient à 1 `Company` (pour agrégation CRM)

---

### 11. **CardScan** (Analytics scan)
Log de chaque vue/scan d'une carte

**Champs clés** :
- `id`, `card_id`
- `scanned_at`, `ip_address`, `user_agent`
- `country`, `city` (via GeoIP)
- `device_type`: `mobile` | `desktop` | `tablet`

**Relations** :
- Appartient à 1 `Card`

---

### 12. **Inventory** (Stock)
Stocks de cartes physiques par entrepôt

**Champs clés** :
- `id`, `sku`, `warehouse`
- `quantity_physical`: Stock réel
- `quantity_reserved`: Réservé (commandes en cours)
- `quantity_available`: Computed (physical - reserved)

---

### 13. **HardwareOrder** (Commande cartes physiques)
Commandes de cartes NFC par les entreprises

**Champs clés** :
- `id`, `company_id`
- `order_number`: ex `ORD-2025-001`
- `quantity`
- `status`: `pending` | `processing` | `shipped` | `delivered`
- `warehouse`, `shipping_address`
- `tracking_number`, `shipped_at`, `delivered_at`

**Relations** :
- Appartient à 1 `Company`

---

### 14. **Department** (Département/Groupe)
Groupes d'employés dans une entreprise (Sales, Marketing, etc.)

**Champs clés** :
- `id`, `company_id`, `name`

**Relations** :
- Appartient à 1 `Company`
- Plusieurs `User` peuvent être dans ce département (many-to-many via `user_departments`)

---

### 15. **CompanyBranding** (Identité visuelle entreprise)
Configuration du branding de l'entreprise

**Champs clés** :
- `id`, `company_id` (UNIQUE)
- `logo_light_url`, `logo_dark_url`
- `primary_color`, `font_family`
- `lock_photo`, `lock_job_title`, `force_logo` (Master Lock)

**Relations** :
- Appartient à 1 `Company`

---

### 16. **AuditLog** (Log d'audit)
Traçabilité de toutes les actions sensibles

**Champs clés** :
- `id`, `user_id`
- `action`: ex `company.suspended`, `user.created`
- `entity_type`: `Company`, `User`, `Card`, etc.
- `entity_id`: ID de l'entité modifiée
- `changes`: JSON (ancien/nouveau état)
- `ip_address`, `user_agent`

**Relations** :
- Appartient à 1 `User` (qui a fait l'action)

---

### 17. **RefreshToken** (Token JWT refresh)
Tokens de rafraîchissement JWT

**Champs clés** :
- `id`, `user_id`
- `token`: Token haché
- `expires_at`, `revoked_at`

**Relations** :
- Appartient à 1 `User`

---

### 18. **PasswordReset** (Réinitialisation MDP)
Tokens de reset mot de passe

**Champs clés** :
- `id`, `email`, `token`
- `expires_at`, `used_at`

---

### 19. **CompanyInvitation** (Invitation employé)
Invitations envoyées aux employés pour rejoindre une entreprise

**Champs clés** :
- `id`, `company_id`, `email`, `token`
- `invited_by_user_id`
- `expires_at`, `accepted_at`

**Relations** :
- Appartient à 1 `Company`
- Créée par 1 `User` (admin)

---

### 20. **UserDepartment** (Relation many-to-many)
Table de jonction entre Users et Departments

**Champs clés** :
- `user_id`, `department_id`

---

## 🔗 GRAPHE DES RELATIONS

```
Company
├── Users (1:N)
│   └── Cards (1:1)
│       ├── SocialLinks (1:N)
│       ├── CardScans (1:N)
│       └── ContactLeads (1:N)
├── Subscription (1:1)
│   └── SubscriptionPlan (N:1)
├── Transactions (1:N)
├── CompanyBranding (1:1)
├── Departments (1:N)
│   └── Users (N:N via UserDepartment)
├── HardwareOrders (1:N)
└── CompanyInvitations (1:N)

PhysicalCard
├── Card (N:1) [nullable]
└── Inventory (via SKU+warehouse)

User
├── RefreshTokens (1:N)
├── AuditLogs (1:N)
```

---

## ✅ TOTAL : 20 ENTITÉS

Toutes les entités nécessaires pour le fonctionnement complet du SaaS V-Card.
