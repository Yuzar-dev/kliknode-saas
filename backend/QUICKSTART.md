# 🚀 GUIDE DE DÉMARRAGE RAPIDE - V-CARD SAAS BACKEND

## ✅ CE QUI A ÉTÉ FAIT

### 📁 **25+ fichiers créés**

#### Configuration
- ✅ `package.json` - Dépendances et scripts
- ✅ `tsconfig.json` - Configuration TypeScript
- ✅ `nodemon.json` - Hot reload dev
- ✅ `.env` - Variables d'environnement (dev)
- ✅ `.env.example` - Template env vars
- ✅ `.gitignore` - Fichiers ignorés
- ✅ `README.md` - Documentation complète

#### Prisma
- ✅ `prisma/schema.prisma` - Schéma DB (20 tables)
- ✅ `prisma/seed.ts` - Données de test

#### Source Code
- ✅ `src/server.ts` - Point d'entrée Express
- ✅ `src/config/database.ts` - Config Prisma
- ✅ `src/types/express.d.ts` - Types TypeScript

#### Middlewares (5)
- ✅ `middlewares/auth.middleware.ts` - Authentification JWT
- ✅ `middlewares/role.middleware.ts` - Vérification rôles
- ✅ `middlewares/validate.middleware.ts` - Validation Zod
- ✅ `middlewares/rate-limit.middleware.ts` - Rate limiting
- ✅ `middlewares/error.middleware.ts` - Gestion erreurs

#### Utilitaires (4)
- ✅ `utils/jwt.util.ts` - Génération/validation JWT
- ✅ `utils/bcrypt.util.ts` - Hash mots de passe
- ✅ `utils/logger.util.ts` - Logging Winston
- ✅ `utils/slug.util.ts` - Génération slugs

#### Services (2)
- ✅ `services/audit.service.ts` - Logs d'audit
- ✅ Config Prisma Client

#### Routes & Controllers
- ✅ `routes/index.ts` - Point d'entrée routes
- ✅ `routes/auth.routes.ts` - Routes auth
- ✅ `controllers/auth/auth.controller.ts` - Login, Register, etc.
- ✅ `validators/auth.validator.ts` - Schémas Zod auth

### 📦 **Dépendances installées**
- ✅ **718 packages NPM** installés
- ✅ Client Prisma généré

---

## 🔧 PROCHAINES ÉTAPES (À FAIRE)

### 1️⃣ **Démarrer PostgreSQL**

Pour que la migration Prisma fonctionne, PostgreSQL doit être démarré.

#### Option A : PostgreSQL local

Si vous avez PostgreSQL installé :
```bash
# macOS (Homebrew)
brew services start postgresql

# Vérifier le status
brew services list
```

#### Option B : PostgreSQL avec Docker (RECOMMANDÉ)

Si vous n'avez pas PostgreSQL, utilisez Docker :

```bash
docker run --name vcard-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=vcard_saas_dev \
  -p 5432:5432 \
  -d postgres:15
```

#### Option C : Modifier le .env pour une DB existante

Si vous avez déjà une DB PostgreSQL ailleurs, modifiez `DATABASE_URL` dans `.env` :
```
DATABASE_URL=postgresql://user:password@host:port/database
```

---

### 2️⃣ **Exécuter la migration Prisma**

Une fois PostgreSQL démarré :

```bash
cd "/Users/youssef/Documents/NFC/NFC SAAS/backend"

# Créer les tables
npm run prisma:migrate

# Si erreur, forcer la création
npx prisma migrate dev --name init
```

**Résultat attendu** :
```
✔ Applied migration: 20xx_init
✔ Generated Prisma Client
```

---

### 3️⃣ **Insérer les données de test (Seeds)**

```bash
npm run prisma:seed
```

**Résultat attendu** :
```
🌱 Starting database seed...
✅ Created 3 subscription plans
✅ Created 2 promo codes
✅ Created super admin
✅ Created 2 companies
✅ Created 6 users with cards
✅ Created 2 inventory entries
🎉 Seed completed successfully!

📝 CREDENTIALS:
   Super Admin:  admin@vcard.io / Admin123!
   Tesla Admin:  elon@tesla.com / User123!
   ...
```

---

### 4️⃣ **Démarrer le serveur**

```bash
npm run dev
```

**Résultat attendu** :
```
🚀 Server running on http://localhost:3000
📚 API available at http://localhost:3000/api
🏥 Health check at http://localhost:3000/health
🌍 Environment: development
✅ Database connected successfully
```

---

### 5️⃣ **Tester l'API**

#### Test 1 : Health Check
```bash
curl http://localhost:3000/health
```

**Réponse attendue** :
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-02-17T...",
    "uptime": 5.123
  }
}
```

#### Test 2 : Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vcard.io","password":"Admin123!"}'
```

**Réponse attendue** :
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "admin@vcard.io",
      "role": "super_admin",
      ...
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

#### Test 3 : Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName":"John",
    "lastName":"Doe",
    "email":"john@test.com",
    "password":"SecurePass123!"
  }'
```

---

## 🐛 TROUBLESHOOTING

### Erreur : "Can't reach database server"
➡️ PostgreSQL n'est pas démarré. Voir étape 1.

### Erreur : "database does not exist"
➡️ Créer manuellement :
```bash
psql -U postgres -c "CREATE DATABASE vcard_saas_dev;"
```

### Erreur : Port 3000 déjà utilisé
➡️ Changer dans `.env` :
```
PORT=3001
```

### Erreur : Module not found
➡️ Réinstaller :
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 RÉSUMÉ DU BACKEND

| Composant | Statut | Détails |
|-----------|--------|---------|
| **Configuration** | ✅ Terminé | package.json, tsconfig, .env |
| **Dépendances** | ✅ Installé | 718 packages NPM |
| **Schéma DB** | ✅ Créé | 20 tables Prisma |
| **Middlewares** | ✅ Codés | Auth, Role, Validate, RateLimit, Error |
| **Utilitaires** | ✅ Codés | JWT, Bcrypt, Logger, Slug |
| **Services** | ✅ Codés | Audit, Prisma Client |
| **Routes Auth** | ✅ Codées | Login, Register, ForgotPW, ResetPW, Refresh |
| **Seeds** | ✅ Créées | 6 users, 2 companies, 3 plans |
| **Migration DB** | ⏳ À faire | Nécessite PostgreSQL démarré |
| **Serveur** | ⏳ À tester | `npm run dev` |

---

## 🎯 APRÈS LE DÉMARRAGE

Une fois le backend fonctionnel, vous pourrez :

1. ✅ Tester toutes les routes Auth
2. ✅ Ouvrir Prisma Studio : `npm run prisma:studio`
3. ✅ Commencer la **Phase 2** : Construction des interfaces

**Phase 2** = On va coder page par page :
- Je demande le code HTML/React
- Je crée les endpoints backend nécessaires
- Je connecte frontend ↔ backend
- On teste et on valide
- On passe à la page suivante

---

## 📞 BESOIN D'AIDE ?

Si tu as un problème, partage-moi :
1. La commande que tu as exécutée
2. L'erreur complète
3. Ton environnement (macOS, Docker, etc.)

**Backend prêt à démarrer ! 🚀**
