# Visualisez l'OpenData au clair de lune — Frontend Implementation Plan

**Projet :** Visualisez l'OpenData au clair de lune  
**Partenaire :** Apside — **Thématique :** Futur des données ouvertes — **Sous-thème :** La Nuit  
**Version :** 1.0.0 (Spécifications de développement & Plan Frontend)  
**Document compagnon de :** `architecture.md`, `api-contract.md` et `backend-plan.md`  

---

## 1. Objectif & Rôle du Document

Ce document définit la feuille de route opérationnelle pour le développement de l'interface utilisateur (Frontend) du projet **« Visualisez l'OpenData au clair de lune »**.

Il organise la construction d'une interface monopage (SPA) immersive, interactive et fluide, répondant aux huit fonctionnalités (F1 à F8) du cahier des charges, en s'appuyant sur les contrats de données formalisés dans `api-contract.md` et les principes directeurs d'`architecture.md`.

**Sources de vérité du Frontend :**
- Architecture système et découpage en couches : `architecture.md`.
- Contrats de données, DTOs (`CenterEntity`) et événements : `api-contract.md`.
- Exigences d'ergonomie, thème nocturne et fonctionnalités : `cahier_charge.md`.

---

## 2. Périmètre de Responsabilité (Ownership)

L'équipe Frontend est responsable exclusive de :
- L'ensemble du code de présentation et de rendu visuel situé dans `src/` (hors logique pure de normalisation des données).
- L'intégration de la carte interactive Leaflet.js (`src/map/**`).
- L'intégration des graphiques analytiques Chart.js (`src/components/timeChart.js`).
- Le système de composants UI réactifs (`src/components/**`).
- Les styles CSS, animations nocturnes, design system sombre et effets de lueur néon (`src/assets/css/**`).
- La gestion de l'état local réactif (`src/core/state.js`) et de l'Event Bus (`src/core/eventBus.js`).
- L'accessibilité visuelle (WCAG 2.1 AAA pour Dark Mode) et la compatibilité responsive (Desktop, Tablette, Mobile).

---

## 3. Environnement d'Exécution & Outils

```bash
# Lancement de l'environnement de développement local (Vite HMR)
npm run dev
# URL locale : http://localhost:5173

# Compilation de production (Minification & Tree-shaking)
npm run build
# Dossier de sortie prêt pour GitHub Pages / Netlify : /dist

# Prévisualisation du bundle de production
npm run preview
```

### Stack Technique Frontend :
- **Langages de base :** HTML5 sémantique, CSS3 moderne (Variables CSS, Flexbox, Grid, Glassmorphism), JavaScript ES6+ modulaire.
- **Moteur Cartographique :** Leaflet.js v1.9+ avec tuiles *CartoDB Dark Matter*.
- **Moteur Graphique :** Chart.js v4+ configuré en mode sombre haute visibilité.
- **Icônes :** SVG inline et icônes vectorielles légères (thématique astrale et sociale).
- **Navigateurs cibles :** Chrome, Firefox, Edge (2 dernières versions majeures), Safari iOS et Chrome Android.

---

## 4. Règles d'Ingénierie & Principes UX

1. **Dark Mode Absolu & Confort Nocturne :** Palette dominée par le noir d'encre (`#070A13`) et le bleu nuit profond (`#0F172A`). Les textes secondaires respectent un ratio de contraste strict $\ge 7:1$ pour éviter l'éblouissement tout en garantissant une lisibilité parfaite dans l'obscurité.
2. **Couleurs Néon Identifiantes :**
   - `CHU` (Urgence sociale) : Vert Néon (`#39FF14`).
   - `CHRS` (Réinsertion) : Jaune Néon (`#FFE600`).
   - `SSP` (Proximité) : Cyan Électrique (`#00F0FF`).
   - `CASVP` (Action Sociale) : Magenta / Violet (`#D946EF`).
   - Accent Lunaire / Général : Blanc Argenté (`#E2E8F0`).
3. **Zéro Rechargement de Page :** Toutes les interactions (recherche, changement de filtre, ouverture de fiche, bascule Focus Nuit) s'exécutent de façon asynchrone et réactive.
4. **Gestion Obligatoire des États Asynchrones :** Chaque composant gère explicitement 4 états :
   - *Loading* : Squelettes sombres animés (*dark skeleton loaders*) ou spinner néon.
   - *Success* : Rendu fluide avec transition d'apparition en fondu (*fade-in*).
   - *Empty* : Message clair avec bouton de réinitialisation si une recherche ne donne aucun résultat.
   - *Error* : Bannière discrète signalant l'utilisation du mode de secours local sans bloquer l'usage.
5. **Mobile-First pour le Bottom Sheet :** Le panneau de détails (F4) adopte un comportement natif avec glissement tactile fluide (*drag to dismiss*), adapté aux usages sur smartphone sur le terrain.

---

## 5. Arborescence & Hiérarchie des Composants UI

```
src/
├── main.js                          # Initialisation et montage de l'application
├── assets/
│   └── css/
│       ├── reset.css                # Normalisation CSS
│       ├── variables.css            # Variables de couleurs sombres et néon
│       ├── typography.css           # Polices Inter et JetBrains Mono
│       ├── map.css                  # Styles de Leaflet, marqueurs et popups sombres
│       ├── bottom-sheet.css         # Transitions et disposition du Bottom Sheet
│       └── animations.css           # Effets de pulsation, lueurs néon et étoiles filantes
├── components/
│   ├── header.js                    # Barre de navigation supérieure et icône lune
│   ├── dashboard.js                 # Cartes statistiques F2 (Centres, Lits, Ratios)
│   ├── liveCounter.js               # Compteur F7 avec pulsation cardiaque
│   ├── searchFilter.js              # Barre de recherche F3 et bouton Focus Nuit F5
│   ├── bottomSheet.js               # Fiche détaillée glissante F4
│   ├── timeChart.js                 # Modale / Volet rétractable Chart.js F6
│   └── easterEgg.js                 # Canvas d'animation stellaire et message F8
└── map/
    ├── mapManager.js                # Initialisation Leaflet et gestion de la vue
    ├── markerFactory.js             # Création des L.divIcon néon avec lueurs CSS
    └── clusterManager.js            # Regroupement des points denses en clusters sombres
```

---

## 6. Plan d'Implémentation Frontend Étape par Étape

### Phase 1 — Socle d'Interface, Thème Nocturne & Layout Global
- **Livrables :**
  - Page `index.html` sémantique intégrant les conteneurs : `#header`, `#dashboard`, `#controls`, `#map-container`, `#bottom-sheet`, `#chart-panel`.
  - Feuilles de style de base (`variables.css`, `animations.css`) configurant le thème « Clair de Lune ».
  - Module `src/core/eventBus.js` et `src/core/state.js` initialisés.
  - Composant `header.js` avec titre immersif et icône de lune interactive.
- **Critères d'acceptation :** La structure globale s'affiche en plein écran sans scroll parasite, avec un design sombre cohérent et un header stylisé.

---

### Phase 2 — Carte Nocturne Interactive & Marqueurs Néon (Fonctionnalité F1)
- **Livrables :**
  - Module `src/map/mapManager.js` instanciant Leaflet sur le conteneur `#map-container`.
  - Intégration du fond de carte sombre `CartoDB Dark Matter`.
  - Module `src/map/markerFactory.js` générant des marqueurs personnalisés via `L.divIcon` :
    - Anneaux lumineux extérieurs en CSS (`box-shadow: 0 0 12px <neonColor>`).
    - Infobulles (*tooltips*) sombres au survol affichant le nom de la structure et sa catégorie.
  - Intégration du clustering sombre pour fluidifier l'affichage lors des dézooms.
- **Critères d'acceptation :** La carte de Paris se charge avec fluidité (60 FPS), les marqueurs néon sont distinctement visibles et cliquables.

---

### Phase 3 — Tableau de Bord Statistique & Compteur Dynamique (Fonctionnalités F2 & F7)
- **Livrables :**
  - Composant `src/components/dashboard.js` affichant 3 cartes d'indicateurs :
    1. *Nombre total d'établissements*.
    2. *Capacité globale en lits*.
    3. *Taux de structures actives la nuit*.
  - Composant `src/components/liveCounter.js` (F7) :
    - Effet de défilement numérique dynamique (*roll-up counter*).
    - Animation de pulsation lumineuse périodique mimant les battements nocturnes de la ville.
- **Critères d'acceptation :** Les chiffres s'animent dès la fin du chargement des données et se recalculent instantanément lors des filtrages.

---

### Phase 4 — Barre de Recherche, Filtres & Mode Focus Nuit (Fonctionnalités F3 & F5)
- **Livrables :**
  - Composant `src/components/searchFilter.js` :
    - Champ de recherche textuelle avec loupe néon et bouton d'effacement rapide.
    - Badges cliquables (*tags*) pour sélectionner/désélectionner `CHU`, `CHRS`, `SSP`, `CASVP`.
    - Bouton à bascule interactif pour le **Mode Focus Nuit (F5)**.
  - Logique visuelle du Focus Nuit :
    - Quand activé : application d'une classe `.night-focus-active` sur la carte qui atténue les structures de jour (opacité 15%) et décuple la luminescence des accueils d'urgence ouverts la nuit.
- **Critères d'acceptation :** Taper un texte ou cocher un badge met à jour immédiatement les marqueurs sur la carte et les KPIs sans saccade.

---

### Phase 5 — Fiche Détaillée Coulissante « Bottom Sheet » (Fonctionnalité F4)
- **Livrables :**
  - Composant `src/components/bottomSheet.js` :
    - Panneau glissant depuis le bas de l'écran avec 3 positions : Masqué (`hidden`), Aperçu (`peek`), Plein écran (`expanded`).
    - Prise en charge des gestes tactiles (*touch events* : `touchstart`, `touchmove`, `touchend`) pour monter ou descendre la fiche.
    - Contenu riche : nom de la structure, macaron de catégorie néon, statut de nuit (badge vert "Ouvert cette nuit" ou gris "Fermé la nuit"), adresse complète, téléphone cliquable (`tel:01...`), capacité d'accueil et bouton d'itinéraire externe.
- **Critères d'acceptation :** Cliquer sur un marqueur de la carte ouvre le Bottom Sheet en centrant la vue sur le centre sélectionné ; glisser vers le bas referme le panneau.

---

### Phase 6 — Graphiques Temporels & Spatiaux Chart.js (Fonctionnalité F6)
- **Livrables :**
  - Composant `src/components/timeChart.js` :
    - Volet latéral ou modale dédiée activable par un bouton d'analyse statistique.
    - Histogramme de la répartition des lits par arrondissement parisien.
    - Graphique en anneau (*Doughnut*) de la proportion des accueils de nuit vs jour.
    - Personnalisation complète des options Chart.js (grilles sombres discrètes, infobulles personnalisées avec police *JetBrains Mono*, barres néon avec dégradés).
- **Critères d'acceptation :** Les graphiques sont interactifs, lisibles, et reflètent scrupuleusement les filtres en cours d'application.

---

### Phase 7 — Easter Egg « Clair de Lune », Finitions & Accessibilité (Fonctionnalité F8)
- **Livrables :**
  - Composant `src/components/easterEgg.js` (F8) :
    - Écouteur sur 3 clics consécutifs sur la lune du header ou saisie au clavier du mot `lune`.
    - Déclenchement d'un calque Canvas superposé créant une pluie d'étoiles filantes et une aurore argentée sur la carte de Paris.
    - Message poétique éphémère célébrant le travail des équipes de maraude et les données ouvertes d'Apside.
  - Audit d'accessibilité (contraste des couleurs, navigation complète au clavier via touches `Tab` et `Escape`, descriptions ARIA).
- **Critères d'acceptation :** L'Easter Egg fonctionne parfaitement sans bloquer la navigation et s'estompe naturellement après quelques secondes.

---

## 7. Gestion des Erreurs et Robustesse de l'Interface

| Scénario d'incident | Réaction de l'interface utilisateur |
| :--- | :--- |
| **API OpenData inaccessible ou lente** | Notification discrète dans le pied de page : *"Données chargées depuis la sauvegarde locale"*. Aucun écran blanc. |
| **Aucun résultat trouvé pour un filtre** | Affichage d'un *Empty State* élégant : *"Aucun établissement ne correspond à cette recherche. Cliquez ici pour réinitialiser les filtres"*. |
| **Coordonnées GPS manquantes sur un centre** | Exclusion silencieuse du rendu cartographique, mais inclusion comptabilisée dans les statistiques globales si les données administratives sont valides. |

---

*Ce plan Frontend fournit une feuille de route détaillée et exhaustive pour l'implémentation de l'interface du projet « Visualisez l'OpenData au clair de lune ».*
