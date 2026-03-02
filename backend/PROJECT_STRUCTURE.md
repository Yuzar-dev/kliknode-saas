# 📁 STRUCTURE DU PROJET BACKEND - V-CARD SAAS

## 🎯 CHOIX TECHNOLOGIQUE RECOMMANDÉ

### Option 1 : **Node.js + Express + Prisma** (RECOMMANDÉ)
- ✅ Écosystème riche
- ✅ Prisma ORM très performant
- ✅ TypeScript support excellent
- ✅ Stripe SDK parfait
- ✅ Grande communauté

### Option 2 : PHP + Laravel + Eloquent
- ✅ Très populaire pour SaaS B2B
- ✅ Eloquent ORM puissant
- ✅ Ecosystem mature

### Option 3 : Python + FastAPI + SQLAlchemy
- ✅ Performances excellentes
- ✅ Documentation auto générée
- ✅ Type hints natifs

**Pour ce projet, on part sur Node.js + Express + Prisma** car :
- Meilleure intégration Stripe
- JSON natif (idéal pour les features JSON)
- Écosystème NPM très riche

---

## 📂 STRUCTURE DES DOSSIERS

```
/backend
│
├── /src
│   ├── /config              # Configuration app
│   │   ├── database.ts      # Config DB (Prisma)
│   │   ├── stripe.ts        # Config Stripe
│   │   ├── aws.ts           # Config S3
│   │   ├── email.ts         # Config SendGrid
│   │   └── app.ts           # Config Express
│   │
│   ├── /controllers         # Logique des routes
│   │   ├── /auth
│   │   │   ├── login.controller.ts
│   │   │   ├── register.controller.ts
│   │   │   ├── reset-password.controller.ts
│   │   │   └── refresh-token.controller.ts
│   │   ├── /admin
│   │   │   ├── dashboard.controller.ts
│   │   │   ├── companies.controller.ts
│   │   │   ├── transactions.controller.ts
│   │   │   ├── inventory.controller.ts
│   │   │   ├── operators.controller.ts
│   │   │   └── audit-logs.controller.ts
│   │   ├── /company
│   │   │   ├── dashboard.controller.ts
│   │   │   ├── employees.controller.ts
│   │   │   ├── branding.controller.ts
│   │   │   ├── leads.controller.ts
│   │   │   └── subscription.controller.ts
│   │   ├── /user
│   │   │   ├── card.controller.ts
│   │   │   ├── social-links.controller.ts
│   │   │   ├── contacts.controller.ts
│   │   │   └── profile.controller.ts
│   │   ├── /operator
│   │   │   └── pairing.controller.ts
│   │   └── /public
│   │       ├── profile.controller.ts
│   │       └── activate.controller.ts
│   │
│   ├── /models              # Modèles Prisma (générés auto)
│   │   └── index.ts         # Export Prisma Client
│   │
│   ├── /routes              # Définition des routes
│   │   ├── auth.routes.ts
│   │   ├── admin.routes.ts
│   │   ├── company.routes.ts
│   │   ├── user.routes.ts
│   │   ├── operator.routes.ts
│   │   ├── public.routes.ts
│   │   └── index.ts         # Agrégateur de routes
│   │
│   ├── /middlewares         # Middlewares
│   │   ├── auth.middleware.ts        # Vérifie JWT
│   │   ├── role.middleware.ts        # Vérifie rôle
│   │   ├── validate.middleware.ts    # Validation Zod
│   │   ├── rate-limit.middleware.ts  # Rate limiting
│   │   ├── upload.middleware.ts      # Multer uploads
│   │   └── error.middleware.ts       # Error handling
│   │
│   ├── /services            # Logique métier
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── company.service.ts
│   │   ├── card.service.ts
│   │   ├── subscription.service.ts
│   │   ├── payment.service.ts        # Stripe
│   │   ├── inventory.service.ts
│   │   ├── email.service.ts          # SendGrid
│   │   ├── storage.service.ts        # S3/R2
│   │   ├── qr-code.service.ts
│   │   ├── wallet-pass.service.ts    # Apple/Google Wallet
│   │   └── audit.service.ts
│   │
│   ├── /utils               # Utilitaires
│   │   ├── jwt.util.ts
│   │   ├── bcrypt.util.ts
│   │   ├── slug.util.ts
│   │   ├── invoice.util.ts           # Génération PDF facture
│   │   ├── csv.util.ts               # Export CSV
│   │   ├── geo-ip.util.ts            # GeoIP lookup
│   │   └── logger.util.ts            # Winston/Pino
│   │
│   ├── /validators          # Schémas Zod
│   │   ├── auth.validator.ts
│   │   ├── user.validator.ts
│   │   ├── company.validator.ts
│   │   ├── card.validator.ts
│   │   └── subscription.validator.ts
│   │
│   ├── /types               # Types TypeScript
│   │   ├── express.d.ts     # Extend Express Request
│   │   ├── user.types.ts
│   │   └── api.types.ts
│   │
│   └── server.ts            # Entry point
│
├── /prisma
│   ├── schema.prisma        # Schéma Prisma
│   ├── /migrations          # Migrations SQL (auto)
│   └── seed.ts              # Seeds données test
│
├── /public                  # Fichiers statiques (si besoin)
│   └── /email-templates     # Templates emails HTML
│       ├── welcome.html
│       ├── invitation.html
│       ├── reset-password.html
│       └── invoice.html
│
├── /tests                   # Tests
│   ├── /unit
│   ├── /integration
│   └── /e2e
│
├── .env.example             # Template env vars
├── .env                     # Variables env (gitignored)
├── .gitignore
├── package.json
├── tsconfig.json
├── nodemon.json             # Dev hot reload
└── README.md
```

---

## 📦 DÉPENDANCES (package.json)

### Production
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "@prisma/client": "^5.7.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.22.4",
    "stripe": "^14.8.0",
    "@sendgrid/mail": "^8.1.0",
    "@aws-sdk/client-s3": "^3.470.0",
    "multer": "^1.4.5-lts.1",
    "qrcode": "^1.5.3",
    "passkit-generator": "^3.1.5",
    "pdf-lib": "^1.17.1",
    "csv-parser": "^3.0.0",
    "geoip-lite": "^1.4.7",
    "winston": "^3.11.0",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.5",
    "@types/express": "^4.17.21",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/multer": "^1.4.11",
    "prisma": "^5.7.0",
    "nodemon": "^3.0.2",
    "ts-node": "^10.9.2",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11"
  }
}
```

---

## ⚙️ FICHIERS DE CONFIGURATION

### `.env.example`
```env
# App
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/vcard_saas

# JWT
JWT_SECRET=your-super-secret-key-change-me
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# SendGrid
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@vcard.io
SENDGRID_FROM_NAME=V-Card

# AWS S3 / CloudFlare R2
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=eu-west-3
AWS_S3_BUCKET=vcard-uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "types": ["node", "jest"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### `nodemon.json`
```json
{
  "watch": ["src"],
  "ext": "ts",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "ts-node src/server.ts"
}
```

---

## 🚀 SCRIPTS NPM

```json
{
  "scripts": {
    "dev": "nodemon",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "seed": "ts-node prisma/seed.ts",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write 'src/**/*.ts'"
  }
}
```

---

## 🔧 MIDDLEWARES CONFIGURATION

### `auth.middleware.ts` (Exemple)
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded; // Ajoute user à req
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide' });
  }
};
```

### `role.middleware.ts`
```typescript
export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    next();
  };
};
```

---

## ✅ CHECKLIST PRÉPARATION

- [x] Structure dossiers définie
- [x] Dépendances listées
- [x] Fichiers config créés
- [x] Middlewares specs définis
- [ ] Schéma Prisma à créer
- [ ] Seeds données test à créer
- [ ] Controllers à implémenter

---

**Structure backend complète prête !**
