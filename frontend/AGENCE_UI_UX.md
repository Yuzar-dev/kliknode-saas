# Design System : TITANIUM & OBSIDIAN (Inspiration Apple)

## Vision
Remplacer l'esthétique classique par une expérience de classe mondiale, sobre, technologique et chirurgicale, calquée sur les standards Apple (iOS/macOS/visionOS).

---

## 🎨 1. Palette de Couleurs "Titanium High-Fidelity"

| Élément | Mode Clair | Mode Sombre (OLED) |
| :--- | :--- | :--- |
| **Fond de Page** | `#F5F5F7` (Gris Perle) | `#000000` (Noir Absolu) |
| **Texte Principal** | `#1D1D1F` (Noir Apple) | `#F5F5F7` (Gris Perle) |
| **Texte Secondaire** | `#86868B` (Gris iOS) | `#8E8E93` (Gris Pro) |
| **Accent (Titanium)**| `#4B4B4C` | `#C6C6C6` (Titane Brillant) |

### 💎 Style OBSIDIAN (Gradients Signature)
Utilisé pour les actions critiques et les boutons primaires.
- **Obsidian Dark :** `linear-gradient(90deg, #0F172A, #1E293B)` (Slate/Navy profond).
- **Obsidian Light :** `linear-gradient(90deg, #1C1C1E, #3A3A3C)`.

---

## 🎨 2. Typographie & Icônes
- **Police Unique :** `Poppins`, `tracking-tight`. Les titres majeurs utilisent `font-black`.
- **Iconographie :** `Material Symbols Outlined`.
  - Toujours utiliser `font-light` pour les icônes pour un aspect "filaire" haut de gamme.
  - Taille standard : `24px` pour les actions, `18px` ou `20px` pour les détails.

---

## 🎨 3. L'Élément Clé : LE "GLASS FLOW" (Verre Dépoli)
Toutes les cartes et conteneurs utilisent ce style inspiré de visionOS via la classe `@utility klik-glass` dans `globals.css`.

### Configuration Standard
```css
backdrop-blur-[40px] border border-white/20 shadow-xl rounded-[2.5rem]
```
- **Clair :** `bg-white/60`
- **Sombre :** `bg-[#1C1C1E]/60`

---

## 🎨 4. Layout Ultra-Minimaliste (Mobile-First)

### Header "Éthéré"
- Pas de bordure physique ou de fond solide au repos.
- Utilisation d'un `bg-gradient-to-b` (dégradé du haut vers le bas) pour masquer le contenu défilant sans créer de barre rigide.
- Boutons circulaires flottants.

### Zone d'Action "Floattante"
- Suppression des containers rigides en bas de page.
- Boutons flottant directement sur un `bg-gradient-to-t` (dégradé du bas vers le haut).

---

## 🎨 5. Modal "Sparkle & Connect" (Standard Apple)
La modal de contact est le blueprint pour toutes les interactions de saisie :
- **Background :** `#F2F2F7` (Gris clair iOS) ou `#1C1C1E` (Sombre).
- **Header Icon :** Icône `auto_awesome` (Sparkle) centrée dans un cercle blanc/glass.
- **Inputs "Pill" :** `rounded-3xl`, avec icônes `person`, `mail`, `phone` ancrées à gauche.
- **Security Badge :** Badge compact en bas avec icône `lock` et texte "Your data is safe & private".

---

## 🎨 6. Micro-animations
- **Transitions :** Toujours `duration-500` pour une fluidité "organique".
- **Hover/Active :** Utiliser `active:scale-95` sur tous les boutons pour un feedback tactile.
- **Modals :** Animation `animate-in zoom-in-95 slide-in-from-bottom-10`.
