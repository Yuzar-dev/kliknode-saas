# Contexte du Projet - KlikNode SAAS

KlikNode est une plateforme SaaS innovante de cartes de visite digitales connectées à des puces NFC physiques. Le projet vise à transformer la gestion des contacts professionnels et le réseautage, tant pour les professionnels individuels (B2C) que pour les entreprises (B2B).

---

## 1. Vision du Produit
L'expérience utilisateur repose sur un parcours fluide alliant le physique et le numérique :
1. **Le support physique** : Une carte premium dotée d'une puce NFC ou d'un QR Code unique.
2. **Le scan** : Un tap de la carte sur un smartphone ouvre instantanément le profil numérique du détenteur via une URL courte (ex: `k.kliknode.com/p/nom-utilisateur`).
3. **Le profil en ligne** : Une interface mobile-first, élégante et personnalisable (liens sociaux, coordonnées, identité visuelle, etc.).
4. **L'échange de contacts** : Un formulaire permettant à l'interlocuteur de transmettre ses coordonnées en retour, créant un lead instantanément enregistré.

---

## 2. Modèles Économiques & Personas

### 🏢 Le segment B2B (Entreprises)
Destiné aux organisations souhaitant équiper leurs équipes (collaborateurs, commerciaux, direction) :
* **Console d'administration dédiée** pour gérer l'organigramme, assigner des cartes physiques, standardiser l'identité visuelle (Branding) et centraliser les prospects capturés par les employés.
* **Fonctionnalités avancées** : Segmentation par départements, verrouillage optionnel des informations de profils par l'administrateur, importation en masse d'employés via CSV.

### 👤 Le segment B2C (Professionnels individuels)
Destiné aux indépendants et créateurs souhaitant maximiser l'impact de leurs rencontres physiques :
* **Plan Standard (Gratuit)** : Profil de base, affichage de liens sociaux et téléchargement du profil au format VCF.
* **Plan PRO (Payant)** : Accès au CRM de gestion des prospects, statistiques d'analytics avancées (scans, clics sur réseaux sociaux, etc.), intégration aux portefeuilles mobiles (Apple Wallet, Google Wallet) et designs premium.

---

## 3. Origine et Objectifs de cette Phase
Le projet a fait l'objet d'un transfert entre une agence de développement externe et l'équipe actuelle. Les objectifs de cette phase consistent à :
1. **Stabiliser l'infrastructure** et corriger les incohérences techniques (duplications de code, synchronisations d'authentification).
2. **Implémenter le Plan PRO (B2C)** en raccordant les maquettes statiques existantes aux véritables services backend (analytics, capture de leads publique, webhooks de paiement, sécurité).
3. **Préparer la mise en production locale et distante** sur Vercel et Supabase.
