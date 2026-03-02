-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('super_admin', 'company_admin', 'employee', 'operator');

-- CreateEnum
CREATE TYPE "CountryCode" AS ENUM ('FR', 'MA');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('EUR', 'MAD');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('active', 'suspended', 'trial');

-- CreateEnum
CREATE TYPE "BillingPeriod" AS ENUM ('monthly', 'yearly', 'lifetime');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'cancelled', 'past_due', 'trialing');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('succeeded', 'failed', 'refunded', 'pending');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('stripe', 'manual_transfer', 'promo');

-- CreateEnum
CREATE TYPE "PhysicalCardStatus" AS ENUM ('in_stock', 'reserved', 'paired', 'lost');

-- CreateEnum
CREATE TYPE "Warehouse" AS ENUM ('paris', 'casablanca');

-- CreateEnum
CREATE TYPE "HardwareOrderStatus" AS ENUM ('pending', 'processing', 'shipped', 'delivered');

-- CreateEnum
CREATE TYPE "CardTheme" AS ENUM ('light', 'dark');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('mobile', 'desktop', 'tablet');

-- CreateEnum
CREATE TYPE "ContactSource" AS ENUM ('qr_scan', 'nfc_tap', 'web_link');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "role" "UserRole" NOT NULL,
    "company_id" TEXT,
    "phone" VARCHAR(20),
    "language" VARCHAR(2) NOT NULL DEFAULT 'fr',
    "avatar_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "email_verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "ice" VARCHAR(50),
    "siret" VARCHAR(50),
    "country" "CountryCode" NOT NULL,
    "currency" "Currency" NOT NULL,
    "domain" VARCHAR(255),
    "address" TEXT,
    "city" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "phone" VARCHAR(20),
    "admin_email" VARCHAR(255) NOT NULL,
    "status" "CompanyStatus" NOT NULL DEFAULT 'active',
    "trial_ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "price_eur" DECIMAL(10,2) NOT NULL,
    "price_mad" DECIMAL(10,2) NOT NULL,
    "billing_period" "BillingPeriod" NOT NULL,
    "max_licenses" INTEGER NOT NULL,
    "features" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "stripe_price_id_eur" VARCHAR(255),
    "stripe_price_id_mad" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "cancel_at" TIMESTAMP(3),
    "stripe_subscription_id" VARCHAR(255),
    "payment_method" "PaymentMethod" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "subscription_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "stripe_payment_intent_id" VARCHAR(255),
    "invoice_number" VARCHAR(50),
    "invoice_pdf_url" TEXT,
    "notes" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_codes" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "discount_percent" INTEGER,
    "discount_amount_eur" DECIMAL(10,2),
    "discount_amount_mad" DECIMAL(10,2),
    "max_uses" INTEGER NOT NULL,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "public_slug" VARCHAR(100) NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "job_title" VARCHAR(150),
    "company_name" VARCHAR(255),
    "bio" TEXT,
    "avatar_url" TEXT,
    "cover_url" TEXT,
    "phone_mobile" VARCHAR(20),
    "phone_office" VARCHAR(20),
    "email" VARCHAR(255),
    "website" VARCHAR(255),
    "address" TEXT,
    "city" VARCHAR(100),
    "country" VARCHAR(100),
    "theme" "CardTheme" NOT NULL DEFAULT 'light',
    "primary_color" VARCHAR(7),
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "qr_code_url" TEXT,
    "wallet_pass_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_links" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "platform" VARCHAR(50) NOT NULL,
    "url" TEXT NOT NULL,
    "label" VARCHAR(100),
    "icon" VARCHAR(50),
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "physical_cards" (
    "id" TEXT NOT NULL,
    "uid" VARCHAR(100) NOT NULL,
    "sku" VARCHAR(50),
    "batch_tag" VARCHAR(100),
    "status" "PhysicalCardStatus" NOT NULL DEFAULT 'in_stock',
    "warehouse" "Warehouse" NOT NULL,
    "paired_card_id" TEXT,
    "paired_at" TIMESTAMP(3),
    "paired_by_operator_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "physical_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_scans" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "country" VARCHAR(2),
    "city" VARCHAR(100),
    "referrer" TEXT,
    "device_type" "DeviceType",

    CONSTRAINT "card_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts_leads" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "company_name" VARCHAR(255),
    "notes" TEXT,
    "source" "ContactSource" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL,
    "sku" VARCHAR(50) NOT NULL,
    "warehouse" "Warehouse" NOT NULL,
    "quantity_physical" INTEGER NOT NULL,
    "quantity_reserved" INTEGER NOT NULL,
    "quantity_available" INTEGER NOT NULL,
    "last_adjustment_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hardware_orders" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "order_number" VARCHAR(50) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "HardwareOrderStatus" NOT NULL DEFAULT 'pending',
    "warehouse" "Warehouse" NOT NULL,
    "shipping_address" TEXT NOT NULL,
    "tracking_number" VARCHAR(100),
    "shipped_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hardware_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_departments" (
    "user_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_departments_pkey" PRIMARY KEY ("user_id","department_id")
);

-- CreateTable
CREATE TABLE "company_branding" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "logo_light_url" TEXT,
    "logo_dark_url" TEXT,
    "primary_color" VARCHAR(7),
    "font_family" VARCHAR(100),
    "lock_photo" BOOLEAN NOT NULL DEFAULT false,
    "lock_job_title" BOOLEAN NOT NULL DEFAULT false,
    "force_logo" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_branding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" TEXT NOT NULL,
    "changes" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_invitations" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "invited_by_user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_company_id_idx" ON "users"("company_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE INDEX "companies_slug_idx" ON "companies"("slug");

-- CreateIndex
CREATE INDEX "companies_status_idx" ON "companies"("status");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_company_id_key" ON "subscriptions"("company_id");

-- CreateIndex
CREATE INDEX "subscriptions_company_id_idx" ON "subscriptions"("company_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "transactions_company_id_idx" ON "transactions"("company_id");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "cards_user_id_key" ON "cards"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "cards_public_slug_key" ON "cards"("public_slug");

-- CreateIndex
CREATE INDEX "cards_user_id_idx" ON "cards"("user_id");

-- CreateIndex
CREATE INDEX "cards_public_slug_idx" ON "cards"("public_slug");

-- CreateIndex
CREATE UNIQUE INDEX "physical_cards_uid_key" ON "physical_cards"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "physical_cards_paired_card_id_key" ON "physical_cards"("paired_card_id");

-- CreateIndex
CREATE INDEX "physical_cards_uid_idx" ON "physical_cards"("uid");

-- CreateIndex
CREATE INDEX "physical_cards_status_idx" ON "physical_cards"("status");

-- CreateIndex
CREATE INDEX "physical_cards_warehouse_idx" ON "physical_cards"("warehouse");

-- CreateIndex
CREATE INDEX "card_scans_card_id_idx" ON "card_scans"("card_id");

-- CreateIndex
CREATE INDEX "card_scans_scanned_at_idx" ON "card_scans"("scanned_at");

-- CreateIndex
CREATE INDEX "contacts_leads_user_id_idx" ON "contacts_leads"("user_id");

-- CreateIndex
CREATE INDEX "contacts_leads_company_id_idx" ON "contacts_leads"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_sku_warehouse_key" ON "inventory"("sku", "warehouse");

-- CreateIndex
CREATE UNIQUE INDEX "hardware_orders_order_number_key" ON "hardware_orders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "company_branding_company_id_key" ON "company_branding"("company_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_invitations_token_key" ON "company_invitations"("token");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_links" ADD CONSTRAINT "social_links_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_cards" ADD CONSTRAINT "physical_cards_paired_card_id_fkey" FOREIGN KEY ("paired_card_id") REFERENCES "cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_cards" ADD CONSTRAINT "physical_cards_paired_by_operator_id_fkey" FOREIGN KEY ("paired_by_operator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_scans" ADD CONSTRAINT "card_scans_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts_leads" ADD CONSTRAINT "contacts_leads_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts_leads" ADD CONSTRAINT "contacts_leads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts_leads" ADD CONSTRAINT "contacts_leads_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hardware_orders" ADD CONSTRAINT "hardware_orders_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_departments" ADD CONSTRAINT "user_departments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_departments" ADD CONSTRAINT "user_departments_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_branding" ADD CONSTRAINT "company_branding_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_invitations" ADD CONSTRAINT "company_invitations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_invitations" ADD CONSTRAINT "company_invitations_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
