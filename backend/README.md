# V-Card SaaS Backend

Backend API pour la plateforme V-Card SaaS - Cartes de visite digitales multi-pays (France/Maroc).

## 🚀 Stack Technique

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Validation**: Zod
- **Paiements**: Stripe
- **Storage**: AWS S3 / CloudFlare R2
- **Email**: SendGrid
- **Logging**: Winston

## 📋 Prérequis

- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm ou yarn

## ⚙️ Installation

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Éditer `.env` et remplir toutes les variables, notamment :
- `DATABASE_URL` : URL de connexion PostgreSQL
- `JWT_SECRET` : Clé secrète pour JWT
- `STRIPE_SECRET_KEY` : Clé Stripe
- etc.

### 3. Initialiser la base de données

```bash
# Générer le client Prisma
npm run prisma:generate

# Créer les tables
npm run prisma:migrate

# Insérer les données de test
npm run prisma:seed
```

### 4. Démarrer le serveur

```bash
# Développement (avec hot reload)
npm run dev

# Production
npm run build
npm start
```

Le serveur démarre sur `http://localhost:3000`

## 📚 Documentation API

### Endpoints disponibles

#### Auth
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `POST /api/auth/forgot-password` - Demande reset MDP
- `POST /api/auth/reset-password` - Réinitialiser MDP
- `POST /api/auth/refresh-token` - Rafraîchir token

### Health Check
- `GET /health` - Vérifier l'état du serveur

## 🧪 Tests

```bash
npm test
```

## 📊 Base de Données

### Ouvrir Prisma Studio
```bash
npm run prisma:studio
```

### Créer une nouvelle migration
```bash
npx prisma migrate dev --name <nom_migration>
```

## 🔐 Comptes de Test

Après avoir exécuté `npm run prisma:seed`, les comptes suivants sont disponibles :

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| admin@vcard.io | Admin123! | Super Admin |
| elon@tesla.com | User123! | Company Admin (Tesla) |
| admin@marjane.ma | User123! | Company Admin (Marjane) |
| operator.paris@vcard.io | Operator123! | Operator |

## 📁 Structure du Projet

```
/backend
├── /src
│   ├── /config          # Configuration (DB, services)
│   ├── /controllers     # Logique des routes
│   ├── /middlewares     # Middlewares (auth, validation, etc.)
│   ├── /routes          # Définition des routes
│   ├── /services        # Services métier
│   ├── /utils           # Utilitaires
│   ├── /validators      # Schémas Zod
│   ├── /types           # Types TypeScript
│   └── server.ts        # Point d'entrée
├── /prisma
│   ├── schema.prisma    # Schéma de base de données
│   ├── seed.ts          # Seeds de données
│   └── /migrations      # Migrations SQL
├── /logs                # Logs Winston
├── package.json
├── tsconfig.json
└── .env
```

## 🛡️ Sécurité

- ✅ JWT pour l'authentification
- ✅ Bcrypt pour les mots de passe (12 rounds)
- ✅ Helmet pour la sécurité HTTP
- ✅ CORS configuré
- ✅ Rate limiting sur routes sensibles
- ✅ Validation Zod sur tous les inputs
- ✅ Audit logs pour toutes actions sensibles

## 📝 Logs

Les logs sont enregistrés dans le dossier `/logs` :
- `error.log` : Erreurs uniquement
- `combined.log` : Tous les logs

## 🔄 Scripts Disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Lancer en mode développement |
| `npm run build` | Compiler TypeScript |
| `npm start` | Lancer en production |
| `npm run prisma:generate` | Générer client Prisma |
| `npm run prisma:migrate` | Exécuter migrations |
| `npm run prisma:studio` | Ouvrir interface DB |
| `npm run prisma:seed` | Insérer données de test |
| `npm test` | Lancer les tests |

## 🌍 Environnements

- **Développement** : `NODE_ENV=development` (logs verbeux, Prisma Studio)
- **Production** : `NODE_ENV=production` (logs optimisés, pas de seeds)

## 🐛 Debug

Activer les logs détaillés :
```bash
LOG_LEVEL=debug npm run dev
```

## 📞 Support

Pour toute question, contacter l'équipe dev.

---

**Version**: 1.0.0  
**License**: MIT
