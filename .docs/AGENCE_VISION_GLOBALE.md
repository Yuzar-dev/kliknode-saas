# 🌐 AGENCE_VISION_GLOBALE — KlikNode (V-Card SaaS)

> **Dernière MAJ** : 2026-02-20  
> **Version** : 1.0.0

---

## 🎯 Résumé du Produit

**KlikNode** est une plateforme SaaS B2B de cartes de visite digitales NFC. Elle permet aux entreprises de déployer des cartes de visite connectées (NFC + QR Code) pour l'ensemble de leurs collaborateurs, avec gestion centralisée, analyse des contacts et CRM intégré.

### Proposition de valeur
- **Pour les entreprises** : Déployer et gérer une flotte de cartes de visite digitales en quelques clics, avec branding unifié et analytics.
- **Pour les employés** : Un profil digital personnalisable, partageable par NFC, QR Code ou lien direct.
- **Pour les contacts** : Recevoir instantanément les coordonnées professionnelles et les sauvegarder en un tap.

### Marchés cibles
| Marché | Devise | Régulation |
|--------|--------|------------|
| 🇫🇷 France | EUR | SIRET |
| 🇲🇦 Maroc | MAD | ICE |

---

## 👥 Personas Utilisateurs

### 1. 👑 Super Admin (Opérateur de la plateforme)
- **Profil** : Équipe technique/commerciale de KlikNode
- **Objectifs** : Gérer les entreprises clientes, plans, facturation, inventaire physique, opérateurs
- **Accès** : Dashboard admin complet, toutes les données de toutes les entreprises

### 2. 🏢 Company Admin (Admin entreprise cliente)
- **Profil** : DRH, Responsable comm, Office Manager
- **Objectifs** : Gérer la flotte d'employés, le branding, les leads, la facturation
- **Accès** : Dashboard entreprise, gestion employés/départements/branding/leads

### 3. 👤 Employee (Utilisateur final)
- **Profil** : Collaborateur d'une entreprise cliente
- **Objectifs** : Personnaliser sa carte, consulter ses analytics, gérer ses contacts
- **Accès** : Éditeur de carte, liens sociaux, analytics perso, leads perso

### 4. ⚙️ Operator (Logisticien)
- **Profil** : Agent en entrepôt (Paris ou Casablanca)
- **Objectifs** : Pairer les cartes NFC physiques aux comptes utilisateurs
- **Accès** : Outil de pairing, scanner UID

---

## 🔑 Fonctionnalités Clés

### Module Authentification
- Inscription B2C (auto-signup)
- Login / Logout (JWT + Refresh Token)
- Mot de passe oublié / Reset
- Invitation entreprise (lien d'accès)
- SSO Google / Microsoft (prévu)

### Module Super Admin
- Dashboard global (MRR, ARR, churn, users actifs)
- Gestion entreprises (CRUD, suspend, impersonate)
- Plans & Facturation (CRUD plans, transactions, codes promo)
- Logistique (inventaire par entrepôt, commandes hardware, batch generator)
- Opérateurs (CRUD, gestion accès)
- Audit Logs (traçabilité complète)

### Module Company Admin
- Dashboard entreprise (cartes actives, scans, top employés)
- Gestion flotte employés (CRUD, import CSV, reset MDP)
- Départements (groupes organisationnels)
- Branding (logo, couleur primaire, master lock)
- Leads / CRM (contacts collectés, export, sync externe)
- Facturation (abonnement, factures, upgrade/cancel)
- Commandes hardware (e-shop cartes NFC)

### Module Employee
- Éditeur de carte digitale (infos, photo, couverture, bio)
- Liens sociaux (drag & drop, icônes)
- Analytics personnels (vues, clics)
- Contacts/Leads (export VCF, Excel)
- Carte physique (statut, déclarer perdue)

### Module Public
- Profil public (`/p/:slug`) — page vitrine responsive
- Échange de contact (formulaire modal)
- Téléchargement VCF
- Routeur intelligent d'activation (`/activate/:uid`)

### Module Opérateur
- Outil de pairing (scan UID → associer à un utilisateur)
- Sessions de pairing par lot

---

## 📊 Modèle Économique

- **Abonnement mensuel / annuel / lifetime** par entreprise
- **Tarification bi-devise** (EUR / MAD)
- **Paiement** : Stripe (carte bancaire) + virement manuel + code promo
- **E-shop** : Vente de cartes NFC physiques (livraison depuis Paris ou Casablanca)
