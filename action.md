# Prochains Développements Prévus (Action)

Ce document présente la feuille de route technique pour finaliser KlikNode et assurer son déploiement complet.

---

## 📅 Court Terme : Finalisation du Plan PRO (B2C)

### 1. Intégration Réelle de Stripe
*   **Création de session de paiement** : Implémenter le contrôleur `create-checkout-session` pour rediriger l'utilisateur vers Stripe Checkout avec son identifiant utilisateur (`userId`) passé dans les métadonnées de transaction.
*   **Portail client (Customer Portal)** : Implémenter la route d'ouverture du portail de facturation Stripe afin de permettre aux utilisateurs PRO de gérer ou annuler leur abonnement de façon autonome.
*   **Remplacement du mock** : Remplacer l'appel `/upgrade-simulate` du frontend par ce parcours de facturation réel.

### 2. Génération de Pass Wallet (Apple Wallet / Google Wallet)
*   **Service PassKit** : Utiliser la bibliothèque `passkit-generator` présente dans le projet pour générer un fichier de pass `.pkpass` dynamique à partir des informations de la carte digitale de l'utilisateur.
*   **Intégration frontend** : Ajouter un bouton "Ajouter à Apple Wallet" sur le profil de la carte digitale pour les membres PRO.

---

## 🛠️ Moyen Terme : Consolidation de l'Architecture et Nettoyage

### 3. Résolution de la duplication API (Unification)
Le projet comporte actuellement une redondance majeure avec le dossier `/backend/src` et `/frontend/server`. Il convient de :
*   **Trancher sur l'architecture de production** : 
    *   *Option A* : Conserver le backend Express autonome (`/backend`) et le déployer sur une instance séparée (ex: Render, Railway, AWS ECS). Dans ce cas, supprimer `/frontend/server`.
    *   *Option B* : Conserver le backend embarqué dans Next.js (déploiement serverless unique sur Vercel via la route catch-all). Dans ce cas, supprimer définitivement le dossier racine `/backend` pour éviter tout conflit de code futur.

### 4. Service d'Upload de Médias
*   **Stockage persistant** : Implémenter l'upload d'images (avatars utilisateurs, logos d'entreprises, couvertures de cartes) vers AWS S3 ou en utilisant Supabase Storage au lieu d'accepter des URLs textuelles brutes dans le formulaire de modification de profil.

---

## 🔒 Long Terme : Sécurité, Authentification et Tests

### 5. SSO & Validation des Comptes
*   **SSO OAuth** : Activer les fournisseurs Google et Microsoft dans la console Supabase Auth et ajouter les boutons d'accès rapide correspondants sur la page de connexion `/login`.
*   **Validation des adresses e-mails** : Connecter le service SMTP Hostinger au flux d'inscription pour envoyer des liens d'activation de compte et bloquer l'accès aux comptes non vérifiés.

### 6. Tests Automatisés
*   **Tests unitaires** : Rédiger des tests pour les calculateurs de statistiques d'analytics et les filtres de données du CRM.
*   **Tests de bout en bout (E2E)** : Utiliser Playwright ou Cypress pour valider les flux d'inscription, de scan de carte NFC et d'échange de contact.
