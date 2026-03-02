---
name: "Kliknode Premium DA UX"
description: "Directives de la Direction Artistique et de l'UX pour tout nouveau développement sur le SaaS Kliknode (Admin, Entreprise, etc.)"
---

# 🎨 Compétence UX : Direction Artistique "Kliknode Premium"

Cette compétence décrit le "Design System" et les règles strictes d'UX/UI à appliquer lors du développement de TOUTES les futures interfaces pour ce SaaS (panel Admin, espace Entreprise, etc.).

## 1. Philosophie et Esprit (Look & Feel)
- **Cible :** Premium, Haut de Gamme, Luxe (Inspiration Apple).
- **Mots clés :** Épuré, aéré, fluide, contrasté, lisible.
- **Règle absolue :** Ne jamais surcharger l'interface. Moins c'est plus ("Less is more"). Tout doit sembler léger et répondre instantanément aux interactions de l'utilisateur.

## 2. Palette de Couleurs "Apple-like"
Le projet gère nativement le Light et Dark mode via les variables `Tailwind CSS`.
- **Mode Clair (Light) :**
  - **Background profond :** `bg-apple-bgLight` (`#F5F5F7`)
  - **Texte Principal :** `text-apple-textDark` (`#1D1D1F`)
  - **Texte Secondaire :** `text-apple-secondary` (`#86868B`)
- **Mode Sombre (Dark) :**
  - **Background profond :** Très noir `dark:bg-black` (`#000000`)
  - **Conteneurs / Cartes :** Gris très foncé `dark:bg-[#1C1C1E]`
  - **Texte Principal :** Blanc Pur `dark:text-white`
  - **Texte Secondaire :** Gris clair `dark:text-gray-400`

## 3. L'ADN Visuel : Le Glassmorphism (Effet Verre)
Les cartes principales et la barre de navigation doivent donner l'impression de flotter au-dessus du fond, tout en le laissant deviner sans ralentir la machine.
- **Classes recommandées :** Toujours utiliser la classe utilitaire personnalisée `@utility klik-glass`.
- **Anatomie de `klik-glass` :**
  - **Mode Clair :** Fond blanc translucide `bg-white/60`, et un flou modéré `backdrop-blur-[12px]`, fine bordure `border-white/80`.
  - **Mode Sombre :** Fond noir/gris translucide `bg-[#1C1C1E]/60` ou `bg-black/40`, bordure discrète `border-white/10`.
- ⚠️ **Attention aux performances :** Ne jamais mettre un `backdrop-blur-md` ou plus grand que 12px sur des gros blocs de contenu pour éviter les saccades lors du défilement. Ne pas ajouter de classe "ambient-glow" sous les objets interactifs.

## 4. Typographie
- **Police (Font) :** `Poppins` (combinée au fall-back `-apple-system`).
- **Styles :** Préférer les polices en graisses moyennes (`font-medium`, `font-semibold`) pour les blocs de données et les en-têtes. Le corps du texte (paragraphes) doit souvent être plus discret (ex: `text-sm text-gray-500`).

## 5. Interactions et Animations
L'application doit donner une impression de réactivité instantanée.
- **Boutons :** Les boutons doivent paraître solides. 
  - Utiliser des profils fortement arrondis : `rounded-full` ou `rounded-[9999px]`.
  - Gradient exclusif "Titanium" pour le primaire : `btn-titanium-primary` (Gradient subtil entre `#334155` et `#0F172A`).
  - **Action :** Au survol (`hover`), légère augmentation d'échelle et élévation de l'ombre `translateY(-1px)`. Au clic (`active`), rétrécissement sec en douceur `scale(0.95)` via la classe `btn-titanium`.
- **Transitions :** Toujours utiliser des temps de transition réalistes : `transition-all duration-300 ease-in-out` ou la courbe personnalisée `cubic-bezier(0.4, 0, 0.2, 1)`. Éviter les apparitions lentes de 1000ms.

## 6. Structure et Espacements (Layout)
- **Bords Arrondis :** Les grandes cartes, panneaux, et modales doivent utiliser un arrondi massif pour adoucir le design robuste : `rounded-[20px]`, `rounded-[24px]` ou même `rounded-3xl`.
- **Espacement (Margin/Padding) :** Ne pas coller les éléments. Utiliser des espaces généreux (`gap-6`, `p-6`, `p-8` sur Desktop) pour laisser respirer l'information.
- **Scrollbars (Barres de défilement) :** Appliquer `custom-scrollbar` ou `no-scrollbar` pour masquer la grossière barre de défilement standard du navigateur. 

## Comment utiliser cette compétence :
Lorsque l'utilisateur demande "Créer la page X pour le dashboard Admin", vous DEVEZ :
1. Importer et appliquer ces classes couleurs Tailwind.
2. Formater le composant principal comme une carte avec `klik-glass` et de généreux bords ronds (`rounded-[24px]`).
3. Créer des boutons en pilule (`rounded-full`) utilisant les utilitaires `btn-titanium`.
4. Contrôler rigoureusement que le `dark mode` (préfixe `dark:`) transforme gracieusement l'interface du blanc crème au noir profond sans altérer la mise en page.
