# 🚀 Liste des Variables d'Environnement (Vercel Production)

Afin de déployer la V1 sur Vercel, voici la liste exhaustive des variables d'environnement que vous devez configurer dans les paramètres de vos projets Vercel (Frontend et Backend).

---

## 🖥 VERCEL PROJET 1 : FRONTEND (`app.kliknode.com` & `k.kliknode.com`)

| Nom de la Variable | Valeur à Copier-Coller | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hpyclqmbzqhlbqrkxdsm.supabase.co` | L'URL de votre projet Supabase en production. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_FxNhWB853OZVHUeNevU2zA_kyZUcc1l` | Clé publique anonyme Supabase. |
| `NEXT_PUBLIC_API_URL` | `https://api.kliknode.com` | (Optionnel si vous déployez le backend sur Vercel/Render) URL de votre API Node.js. |

*Note sur le Frontend : Le middleware gère automatiquement la redirection vers `/activate/[uid]` si le domaine entré par l'utilisateur est `k.kliknode.com`.*

---

## ⚙️ VERCEL PROJET 2 : BACKEND (ou Render / Heroku)

Si le Backend est également déployé (sur Vercel avec des Serverless Functions ou une machine dédiée), voici ses variables :

| Nom de la Variable | Valeur à Copier-Coller | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Active le mode production (optimisation, logs réduits). |
| `PORT` | `4000` | Port du serveur (souvent ignoré par Vercel). |
| `FRONTEND_URL` | `https://app.kliknode.com` | URL du front pour autoriser les requêtes CORS. |
| `DATABASE_URL` | `postgresql://postgres:yt4em4N7EY.!L*&@db.hpyclqmbzqhlbqrkxdsm.supabase.co:5432/postgres` | Lien de connexion PostgreSQL de production (Supabase). |
| `JWT_SECRET` | `dev-secret-key-please-change-in-production-12345` | (Optionnel: à changer plus tard pour la sécurité). |
| `JWT_REFRESH_SECRET`| `dev-refresh-secret-key-please-change-in-production-67890` | (Optionnel: à changer plus tard). |
| `STRIPE_SECRET_KEY` | `sk_test_replace_with_your_key` | (Temporaire: à remplacer par la clé en direct Stripe). |
| `STRIPE_WEBHOOK_SECRET` | `whsec_replace_with_your_webhook_secret` | (Temporaire: à remplacer par le webhook Live). |
| `SENDGRID_API_KEY` | `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | Clé API de SendGrid pour l'envoi d'emails (Récupérez-la dans .env.local). |
| `AWS_ACCESS_KEY_ID` | `votre_clé` | (Optionnel: Si stockage manuel S3). |
| `AWS_SECRET_ACCESS_KEY`| `votre_secret` | (Optionnel: Si stockage manuel S3). |

---

### ⚠️ Recommandation Post-Déploiement
Une fois ces variables entrées et les deux dépôts déployés, connectez-vous avec `yuzar.prod@gmail.com` sur le frontend pour vérifier que vous accédez bien à l'interface "Opérateur" ou "Super Admin".
