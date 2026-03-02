# 🎨 AGENCE_UI_UX — KlikNode Design System

> **Dernière MAJ** : 2026-02-20  
> **Version** : 1.0.0

---

## 🎨 Palette de Couleurs

### Mode Light (`:root`)

| Token | Valeur oklch | Usage |
|-------|-------------|-------|
| `--background` | `oklch(1 0 0)` | Fond de page |
| `--foreground` | `oklch(0.145 0 0)` | Texte principal |
| `--card` | `oklch(1 0 0)` | Fond des cartes |
| `--primary` | `oklch(0.205 0 0)` | Boutons principaux (noir) |
| `--primary-foreground` | `oklch(0.985 0 0)` | Texte sur bouton primaire |
| `--secondary` | `oklch(0.97 0 0)` | Fonds secondaires |
| `--muted` | `oklch(0.97 0 0)` | Texte atténué bg |
| `--muted-foreground` | `oklch(0.556 0 0)` | Texte grisé |
| `--destructive` | `oklch(0.577 0.245 27.325)` | Rouge (erreurs, suppression) |
| `--border` | `oklch(0.922 0 0)` | Bordures |
| `--ring` | `oklch(0.708 0 0)` | Outline focus |

### Mode Dark (`.dark`)

| Token | Valeur oklch | Usage |
|-------|-------------|-------|
| `--background` | `oklch(0.145 0 0)` | Fond sombre |
| `--card` | `oklch(0.205 0 0)` | Carte sur fond sombre |
| `--primary` | `oklch(0.922 0 0)` | Bouton primaire (inversé) |
| `--border` | `oklch(1 0 0 / 10%)` | Bordure subtile |

### Couleurs Tailwind personnalisées (`tailwind.config.ts`)

| Nom | HEX | Usage |
|-----|-----|-------|
| `primary` | `#2463eb` | Bleu KlikNode |
| `primary-dark` | `#1d4ed8` | Bleu hover |
| `background-light` | `#f8f9fc` | BG pages admin |
| `background-dark` | `#111621` | BG dark mode |
| `surface-light` | `#ffffff` | Surface cards |
| `surface-dark` | `#1e293b` | Surface dark |
| `border-light` | `#e2e8f0` | Bordure light |
| `border-dark` | `#334155` | Bordure dark |

### Couleurs Charts (Recharts)

`chart-1` à `chart-5` : Palette oklch vivante pour graphiques.

---

## 🔤 Typographie

| Propriété | Valeur |
|-----------|--------|
| Font family (display & sans) | `Inter` (via `--font-inter`) |
| Font fallback | `sans-serif` |
| Icons principales | Material Icons Outlined (Google Fonts CDN) |
| Icons secondaires | Lucide React + React Icons |

---

## 📐 Espacements & Border Radius

| Token | Valeur |
|-------|--------|
| `--radius` | `0.625rem` (10px) |
| `--radius-sm` | `calc(var(--radius) - 4px)` = 6px |
| `--radius-md` | `calc(var(--radius) - 2px)` = 8px |
| `--radius-lg` | `var(--radius)` = 10px |
| `--radius-xl` | `calc(var(--radius) + 4px)` = 14px |

### Tailwind config
- `rounded-lg` : `0.5rem`
- `rounded-xl` : `0.75rem`
- `rounded-2xl` : `1rem`

---

## 🧱 Composants & Patterns

### Composants shadcn/ui installés
- Button, Input, Label, Card, Badge, Table, Dialog, Select, Tabs
- Sidebar (CSS custom variables pour sidebar)

### Composants custom Admin
| Composant | Fichier | Rôle |
|-----------|---------|------|
| `AdminLayout` | `components/admin/AdminLayout.tsx` | Shell admin (sidebar + header + content) |
| `AdminSidebar` | `components/admin/AdminSidebar.tsx` | Navigation latérale admin |
| `AdminHeader` | `components/admin/AdminHeader.tsx` | Barre supérieure admin |
| `StatsCard` | `components/admin/StatsCard.tsx` | Card de statistique (icône + valeur + trend) |
| `StatusBadge` | `components/admin/StatusBadge.tsx` | Badge coloré par statut |

### Composants custom Company
| Composant | Fichier | Rôle |
|-----------|---------|------|
| `CompanySidebar` | `components/company/CompanySidebar.tsx` | Navigation latérale company |
| `CompanyHeader` | `components/company/CompanyHeader.tsx` | Barre supérieure company |

---

## 🎭 Shadows

| Nom | Définition |
|-----|------------|
| `shadow-soft` | `0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)` |
| `shadow-card` | `0 10px 15px -3px rgba(0,0,0,0.03), 0 4px 6px -2px rgba(0,0,0,0.01)` |

---

## ✅ Conventions de Style

1. **Boutons noirs** (CTA) : `bg-black text-white` avec hover `bg-gray-800` et micro-animation scale.
2. **Boutons danger** : Couleur `destructive` avec confirmation dialog.
3. **Loading states** : Spinner inline + texte « Chargement... ».
4. **Tables** : TanStack React Table avec pagination, tri, et recherche.
5. **Forms** : React Hook Form + Zod pour validation côté client.
6. **Toasts** : `react-hot-toast` (top-right, 4s, vert succès / rouge erreur).
7. **Responsive** : Mobile-first, sidebar collapse sur mobile.
8. **Dark mode** : Support préparé (`.dark` class), pas encore activé en production.
