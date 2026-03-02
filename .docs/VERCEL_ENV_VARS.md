# 🚀 Liste des Variables d'Environnement (Vercel Production)

Afin de déployer la V1 sur Vercel, voici la liste exhaustive des variables d'environnement que vous devez configurer dans les paramètres de vos projets Vercel (Frontend et Backend).

---

## 🖥 VERCEL PROJET 1 : FRONTEND (`app.kliknode.com` & `k.kliknode.com`)

| Nom de la Variable | Valeur Attendue (Exemple) | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[VOTRE_PROJET].supabase.co` | L'URL de votre projet Supabase en production. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1Ni...` | Clé publique anonyme Supabase. |
| `NEXT_PUBLIC_API_URL` | `https://api.kliknode.com` | (Optionnel si vous déployez le backend sur Vercel/Render) URL de votre API Node.js. |

*Note sur le Frontend : Le middleware gère automatiquement la redirection vers `/activate/[uid]` si le domaine entré par l'utilisateur est `k.kliknode.com`.*

---

## ⚙️ VERCEL PROJET 2 : BACKEND (ou Render / Heroku)

Si le Backend est également déployé (sur Vercel avec des Serverless Functions ou une machine dédiée), voici ses variables :

| Nom de la Variable | Valeur Attendue | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Active le mode production (optimisation, logs réduits). |
| `PORT` | `4000` | Port du serveur (souvent ignoré par Vercel, utile pour Render/VPS). |
| `FRONTEND_URL` | `https://app.kliknode.com` | URL du front pour autoriser les requêtes CORS. |
| `DATABASE_URL` | `postgresql://postgres:[PASSWORD]...` | Lien de connexion PostgreSQL de production (Supabase "Transaction pooler"). |
| `JWT_SECRET` | `[SUPER_SECRET_COMPLEXE]` | Clé très complexe pour signer les tokens (Minimum 64 caractères). |
| `JWT_REFRESH_SECRET`| `[SUPER_SECRET_REFRESH]` | Clé complexe pour les refresh tokens. |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Clé secrète de production Stripe. |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Clé webhook Stripe (générée après configuration webhook). |
| `SENDGRID_API_KEY` | `SG....` | Clé API de production SendGrid pour l'envoi d'emails. |
| `AWS_ACCESS_KEY_ID` | `votre_clé` | (Si stockage S3 / R2 activé). |
| `AWS_SECRET_ACCESS_KEY`| `votre_secret` | (Si stockage S3 / R2 activé). |

---

### ⚠️ Recommandation Post-Déploiement
Une fois ces variables entrées et les deux dépôts déployés, connectez-vous avec `yuzar.prod@gmail.com` sur le frontend pour vérifier que vous accédez bien à l'interface "Opérateur" ou "Super Admin".
