# Visualisez l'OpenData au clair de lune — Architecture Technique & System Design

**Projet :** Visualisez l'OpenData au clair de lune  
**Partenaire :** Apside — **Thématique :** Futur des données ouvertes — **Sous-thème :** La Nuit  
**Version :** 1.0.0 (Spécifications MVP & Architecture)  
**Document de référence pour :** Équipe de développement, Backend, Frontend et Déploiement  

---

## Table des Matières

1. [Vue d’ensemble & Contexte](#1-vue-densemble--contexte)
2. [Principes architecturaux](#2-principes-architecturaux)
3. [Architecture globale en couches](#3-architecture-globale-en-couches)
4. [Structure du projet](#4-structure-du-projet)
5. [Acteurs & Profils d’usage](#5-acteurs--profils-dusage)
6. [Modules fonctionnels & Composants du système](#6-modules-fonctionnels--composants-du-système)
7. [Architecture des données & Modèle GeoJSON unifié](#7-architecture-des-données--modèle-geojson-unifié)
8. [Flux de données & Cycle de vie de l'application](#8-flux-de-données--cycle-de-vie-de-lapplication)
9. [Stratégie de résilience & Mode Hors-ligne (Fallback)](#9-stratégie-de-résilience--mode-hors-ligne-fallback)
10. [Architecture cartographique & Rendu visuel nocturne](#10-architecture-cartographique--rendu-visuel-nocturne)
11. [Architecture du tableau de bord & Moteur statistique](#11-architecture-du-tableau-de-bord--moteur-statistique)
12. [Architecture d'interaction & Expérience utilisateur (UX)](#12-architecture-dinteraction--expérience-utilisateur-ux)
13. [Sécurité, Performance & Accessibilité nocturne](#13-sécurité-performance--accessibilité-nocturne)
14. [Design d'interface & Contrats d'événements](#14-design-dinterface--contrats-dévénements)
15. [Architecture de déploiement & Hébergement](#15-architecture-de-déploiement--hébergement)
16. [Diagrammes de séquence](#16-diagrammes-de-séquence)
17. [Stratégie d'évolutivité (Scalability)](#17-stratégie-dévolutivité-scalability)
18. [Matrice de périmètre : MVP vs V2](#18-matrice-de-périmètre--mvp-vs-v2)
19. [Hypothèses & Questions ouvertes (Assumptions & Open Questions)](#19-hypothèses--questions-ouvertes-assumptions--open-questions)

---

## 1. Vue d’ensemble & Contexte

### 1.1 Contexte du défi Apside
Dans le cadre du défi initié par **Apside** sur le thème **« Futur des données ouvertes »** et le sous-thème **« La Nuit »**, le projet **« Visualisez l'OpenData au clair de lune »** a pour ambition de valoriser les données ouvertes de la Ville de Paris en offrant une lecture cartographique et analytique immersive des services sociaux et d'hébergement d'urgence opérationnels pendant les heures nocturnes.

La nuit en milieu urbain transforme les dynamiques d'accès aux services essentiels. Ce projet met en lumière les structures d'hébergement d'urgence (CHU, CHRS) et les centres d'action sociale (CASVP, SSP), souvent invisibles pour le citoyen ou difficiles à appréhender dans des tableaux de données bruts.

### 1.2 Objectif général
Concevoir et déployer une application web interactive, monopage (SPA), adoptant une identité visuelle nocturne (Dark Map immersive, accents luminescents néon), consommant en temps réel les APIs OpenData officielles de Paris, et permettant une exploration fluide, pédagogique et esthétique des infrastructures sociales parisiennes.

### 1.3 Objectifs spécifiques
- **Représentation géographique nocturne :** Visualiser sur une carte sombre (*CartoDB Dark Matter*) l'ensemble des centres sociaux et d'hébergement avec des marqueurs lumineux différenciés.
- **Pilotage statistique instantané :** Fournir un tableau de bord calculant en temps réel les indicateurs clés (total des centres, capacités en lits, estimations d'occupation).
- **Filtrage et recherche multicritères :** Permettre un filtrage immédiat par typologie de structure (CHU, CHRS, SSP, CASVP) et par arrondissement ou nom.
- **Consultation granulaire :** Offrir une fiche détaillée sous forme de *Bottom Sheet* glissant adapté aux usages mobiles et desktop.
- **Mode « Focus Nuit » :** Fonctionnalité innovante isolant les structures ouvertes ou actives de nuit par rapport aux services diurnes.
- **Visualisations temporelles :** Rendre compte de la répartition de la capacité d'accueil via des graphiques dynamiques.
- **Animation et engagement :** Intégrer un compteur vivant animé et un *Easter Egg* immersif en harmonie avec la thématique nocturne.

---

## 2. Principes architecturaux

| Principe | Décision Technique | Justification |
| :--- | :--- | :--- |
| **Architecture Client-Centric (Jamstack)** | SPA sans backend lourd intermédiaire, exécution 100% navigateur | Conforme aux exigences du cahier des charges : déploiement statique ultra-léger (GitHub Pages / Netlify), zéro coût d'infrastructure serveur, latence minimale. |
| **Direct OpenData Consumption** | Consommation directe de l'API Paris OpenData Explore v2.1 via Fetch | Accès direct aux données certifiées à jour, respect des formats standards GeoJSON. |
| **Résilience Offline-First** | Mécanisme de fallback automatique sur jeu de données GeoJSON local | Garantit la disponibilité continue même en cas de panne réseau, de quota API ou de blocage CORS inattendu. |
| **Séparation stricte des préoccupations (SoC)** | Découplage modulaire : Data Layer, State Store, Map Engine, UI Components | Facilite la maintenance, les tests unitaires et l'intégration continue sans effets de bord. |
| **Performance de rendu (60 FPS)** | Marqueurs Leaflet optimisés (DivIcon SVG / Canvas) & requêtes de filtrage en mémoire | Rendu fluide lors des zooms et déplacements sur la carte sans gel du thread principal. |
| **Dark Mode Natif (Contrastes élevés)** | Palette sombre (Navy/Black) conforme WCAG 2.1 AAA pour environnements sombres | Réduction de la fatigue oculaire nocturne et mise en valeur esthétique des données par luminescence. |

---

## 3. Architecture globale en couches

L'application repose sur une architecture client en cinq couches logiques étanches :

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER (UI)                         │
│  ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────────┐  │
│  │ Dark Map Leaflet │ │ Dashboard Cards  │ │ Search & Filter Bar    │  │
│  └──────────────────┘ └──────────────────┘ └────────────────────────┘  │
│  ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────────┐  │
│  │ Sliding Bottom   │ │ Chart.js Temporal│ │ Live Neon Counter &    │  │
│  │ Sheet (Détails)  │ │ Visualizations   │ │ Easter Egg Clair de Lune│ │
│  └──────────────────┘ └──────────────────┘ └────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────┤
│                       REACTIVE STATE & EVENT BUS                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ AppState : { rawData, filteredData, activeFilters, selectedCenter,│  │
│  │              nightFocusMode, metrics, loadingState, errorState } │  │
│  │ EventBus : filter:changed, center:selected, focus:toggled, etc.   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────┤
│                      BUSINESS LOGIC & ENGINE LAYER                     │
│  ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────────┐  │
│  │ Data Normalizer  │ │ KPI Aggregator & │ │ Spatial & Attribute    │  │
│  │ GeoJSON Pipeline │ │ Analytics Engine │ │ Filter Engine          │  │
│  └──────────────────┘ └──────────────────┘ └────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────┤
│                      DATA ACCESS & RESILIENCE LAYER                    │
│  ┌──────────────────────────────────────┐ ┌─────────────────────────┐  │
│  │ OpenData Paris API Client (Fetch)    │ │ Local GeoJSON Fallback  │  │
│  │ (Explore v2.1 GeoJSON Endpoints)     │ │ Provider (Assets)       │  │
│  └──────────────────────────────────────┘ └─────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────┤
│                         EXTERNAL SERVICES LAYER                        │
│  ┌──────────────────────────────────────┐ ┌─────────────────────────┐  │
│  │ opendata.paris.fr (Explore API v2.1) │ │ CartoDB Dark Matter     │  │
│  │ Datasets : SSP/CASVP & Hébergements  │ │ Tile Server (Basemap)   │  │
│  └──────────────────────────────────────┘ └─────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Structure du projet

La structure du code source est pensée pour allier modularité moderne (ES6 Modules), légèreté et simplicité de déploiement statique :

```
opendata-clair-de-lune/
├── index.html                           # Point d'entrée HTML5 structuré & sémantique
├── README.md                            # Documentation d'installation, sources et démo
├── package.json                         # Dépendances de développement (Vite / Linters)
├── vite.config.js                       # Configuration bundler ultra-rapide
├── public/
│   ├── favicon.ico
│   ├── data/                            # Jeux de données GeoJSON de secours (Fallback)
│   │   ├── coordonnees-ssp-et-casvp.fallback.geojson
│   │   └── hebergements-casvp.fallback.geojson
│   └── assets/
│       ├── icons/                       # Icônes SVG lunaires et typologies
│       └── sounds/                      # Effet sonore discret pour l'Easter Egg (optionnel)
└── src/
    ├── main.js                          # Initialisation globale de l'application
    ├── config/
    │   ├── api.config.js                # URLs des endpoints OpenData Paris et fallbacks
    │   └── map.config.js                # Centre de Paris, zooms min/max, CartoDB URL
    ├── core/
    │   ├── state.js                     # Store réactif d'état applicatif
    │   ├── eventBus.js                  # Bus d'événements Pub/Sub découplé
    │   └── constants.js                 # Constantes métier, couleurs néon, typologies
    ├── services/
    │   ├── openDataService.js           # Client HTTP Fetch & orchestration des 2 flux
    │   ├── dataNormalizer.js            # Normalisation et unification des schémas GeoJSON
    │   ├── kpiService.js                # Calcul des statistiques (lits, centres, ratios)
    │   └── filterService.js             # Moteur de recherche textuelle et filtrage par type
    ├── map/
    │   ├── mapManager.js                # Instance Leaflet, initialisation tuiles sombres
    │   ├── markerFactory.js             # Création des marqueurs lumineux SVG / DivIcon
    │   ├── clusterManager.js            # Regroupement des points denses (dark cluster)
    │   └── nightFocusLayer.js           # Gestion du calque Focus Nuit (opacités/lueurs)
    ├── components/
    │   ├── dashboard.js                 # Composant des 3 cartes KPI supérieures
    │   ├── searchFilter.js              # Barre de recherche et sélecteurs de filtres
    │   ├── bottomSheet.js               # Panneau rétractable d'affichage détaillé
    │   ├── timeChart.js                 # Intégration Chart.js (courbes/barres nocturnes)
    │   ├── liveCounter.js               # Compteur numérique animé avec pulsation
    │   └── easterEgg.js                 # Mécanique d'interaction surprise thématique
    └── utils/
        ├── domUtils.js                  # Utilitaires de manipulation du DOM
        ├── formatters.js                # Formatage des adresses, horaires, numéros
        └── geoUtils.js                  # Calculs de distance ou filtrage par arrondissement
```

---

## 5. Acteurs & Profils d’usage

L'application est ouverte et accessible sans compte ni barrière d'authentification :

| Acteur / Rôle | Objectif principal | Parcours utilisateur privilégié |
| :--- | :--- | :--- |
| **Visiteur Citoyen / Usager nocturne** | Découvrir et localiser rapidement les services sociaux parisiens ouverts la nuit. | Ouvre la carte, recherche son arrondissement, active le « Focus Nuit », sélectionne un centre via le Bottom Sheet pour voir adresse et contact. |
| **Intervenant Social / Maraudeur** | Disposer d'un outil d'orientation rapide pour diriger des personnes vulnérables vers des hébergements adaptés. | Filtre par typologie (ex. CHU), consulte le total des lits disponibles et vérifie les spécificités dans la fiche détaillée. |
| **Jury & Évaluateurs Apside** | Évaluer l'originalité de la visualisation OpenData, l'esthétique nocturne, la robustesse technique et le respect des livrables. | Teste l'ergonomie globale, déclenche les filtres en direct, inspecte le graphique temporel et découvre l'Easter Egg. |

---

## 6. Modules fonctionnels & Composants du système

Conformément à la section 3 du cahier des charges, le système intègre huit fonctionnalités majeures (F1 à F8) :

### F1 — Carte Nocturne Interactive (Priorité : Éléments indispensables)
- **Rôle :** Coeur visuel de l'application. Affiche un fond de carte sombre (*CartoDB Dark Matter*) centré sur Paris (`[48.8566, 2.3522]`).
- **Comportement des points :** Chaque centre est représenté par un marqueur néon lumineux doté d'une lueur CSS (*box-shadow / drop-shadow glow*).
- **Interactivité :** 
  - Survol : infobulle (*tooltip*) élégante avec nom et typologie.
  - Clic : recentrage doux (*flyTo*) et émission de l'événement `center:selected` qui déclenche le Bottom Sheet.

### F2 — Tableau de bord statistique (Priorité : Éléments indispensables)
- **Rôle :** Bandeau supérieur présentant trois cartes d'indicateurs synthétiques réactifs aux filtres appliqués :
  1. **Total des structures répertoriées :** Nombre entier dynamique.
  2. **Capacité totale d'accueil (Lits / Places) :** Somme cumulée issue des données `hebergements-casvp`.
  3. **Taux estimé de mobilisation / couverture nocturne :** Ratio calculé entre structures d'urgence de nuit et structures d'accueil de jour.

### F3 — Recherche et Filtrage multicritères (Priorité : Éléments indispensables)
- **Rôle :** Panneau de contrôle permettant à l'utilisateur de segmenter instantanément les données :
  - **Recherche textuelle :** Auto-complétion tolérante sur le nom de l'établissement, la rue ou le code postal / arrondissement.
  - **Filtres par typologie :** Boutons à bascule (*chips/tags*) pour :
    - `CHU` : Centre d'Hébergement d'Urgence.
    - `CHRS` : Centre d'Hébergement et de Réinsertion Sociale.
    - `SSP` : Services Sociaux de Proximité.
    - `CASVP` : Centres d'Action Sociale de la Ville de Paris.
  - **Bouton de réinitialisation rapide :** Restaure l'état par défaut en un clic.

### F4 — Fiche détaillée « Bottom Sheet » (Priorité : Éléments indispensables)
- **Rôle :** Panneau coulissant depuis le bas de l'écran (inspiré des standards ergonomiques mobiles modernes), parfaitement adapté au desktop :
  - **États :** Plié (*hidden*), Aperçu (*peek/collapsed*), Déplié complet (*expanded*).
  - **Contenu :** Nom officiel, catégorie, badge de statut nocturne, adresse complète, arrondissement, capacité d'accueil, coordonnées téléphoniques, et lien vers l'itinéraire cartographique externe.
  - **Contrôles :** Glissement tactile (*drag to dismiss*) ou bouton de fermeture.

### F5 — Mode « Focus Nuit » (Priorité : Innovant)
- **Rôle :** Fonctionnalité thématique différenciante permettant de plonger la ville dans une ambiance nocturne accentuée :
  - **Mécanisme :** Les structures fermées la nuit voient leur opacité chuter à 15% et passent en nuances de gris.
  - **Mise en lumière :** Les structures assurant une permanence nocturne (accueils d'urgence 24h/24, CHU de nuit) voient leur marqueur pulser intensément en vert/jaune néon.
  - **Affichage dynamique :** Un filtre visuel obscurcit subtilement la carte pour créer un contraste dramatique.

### F6 — Visualisations graphiques temporelles (Priorité : Dynamique)
- **Rôle :** Rendu analytique propulsé par **Chart.js** :
  - **Visualisation 1 :** Histogramme de la capacité d'accueil par arrondissement parisien.
  - **Visualisation 2 :** Répartition temporelle estimée de l'activité (structures diurnes vs permanences nocturnes).
  - **Thème graphique :** Courbes et barres luminescentes sur fond noir profond, infobulles personnalisées avec typographie moderne.

### F7 — Compteur dynamique en direct (Priorité : Dynamique)
- **Rôle :** Widget interactif affichant le nombre de lits ou de centres actifs en temps réel :
  - **Effet :** Animation numérique fluide d'incrémentation (*counter roll-up*).
  - **Pulsation :** Effet de lueur rythmique simulant les battements de la vie nocturne parisienne (*heartbeat pulse effect*).

### F8 — Easter Egg « Au clair de lune » (Priorité : Bonus d'évaluation)
- **Rôle :** Interaction secrète et immersive récompensant la curiosité de l'utilisateur :
  - **Déclencheur :** Clic répété (3 clics) sur l'icône de la lune dans la barre de titre, ou saisie du mot magique `lune` au clavier.
  - **Effet :** Déclenchement d'une animation poétique de ciel étoilé avec étoiles filantes sur la carte, passage de la carte en mode « Nuit de pleine lune » (teinte argentée/violette néon) et message d'hommage à l'équipe Apside.

---

## 7. Architecture des données & Modèle GeoJSON unifié

### 7.1 Sources de données OpenData Paris
L'application consomme deux flux GeoJSON officiels via l'API Explore v2.1 de `opendata.paris.fr` :

1. **Jeu 1 — Coordonnées des SSP et CASVP :**
   - URL : `https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/coordonnees-ssp-et-casvp/exports/geojson`
   - Description : Points de contact administratifs et sociaux de proximité.
2. **Jeu 2 — Hébergements CASVP (CHU / CHRS) :**
   - URL : `https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/hebergements-casvp/exports/geojson`
   - Description : Centres d'hébergement d'urgence et de réinsertion sociale avec capacités et typologies.

### 7.2 Pipeline de normalisation des données (Normalizer)
Chaque source GeoJSON possédant ses propres conventions de nommage de propriétés, un module dédié `dataNormalizer.js` fusionne et harmonise les entités selon le schéma unifié suivant :

```typescript
interface CenterEntity {
  id: string;                     // Identifiant unique (ex: "ssp_12" ou "heb_45")
  name: string;                   // Nom d'usage de la structure
  category: 'CHU' | 'CHRS' | 'SSP' | 'CASVP'; // Typologie normalisée
  sourceDataset: 'ssp-casvp' | 'hebergements-casvp';
  address: string;                // Adresse postale
  postalCode: string;             // Code postal (ex: "75011")
  arrondissement: number;         // Numéro d'arrondissement (1 à 20)
  phone: string;                  // Numéro de téléphone ou mention "Non renseigné"
  capacity: number;               // Nombre de places/lits (0 si non applicable)
  isNightActive: boolean;         // Vrai si ouvert/actif en période nocturne
  openingHoursDescription: string;// Description textuelle des horaires
  coordinates: {
    latitude: number;             // Coordonnée WGS84
    longitude: number;            // Coordonnée WGS84
  };
  rawProperties: Record<string, any>; // Propriétés brutes d'origine conservées
}
```

---

## 8. Flux de données & Cycle de vie de l'application

```
[ Chargement de la page ]
           │
           ▼
[ openDataService.fetchAllData() ]
     ├── Appel API 1 (SSP & CASVP)
     └── Appel API 2 (Hébergements)
           │
     ┌─────┴────────────────────────┐
     ▼ (Succès HTTP)                ▼ (Échec / Offline / Timeout)
[ Récupération GeoJSON ]       [ Chargement GeoJSON Fallback Local ]
     │                              │
     └─────────────┬────────────────┘
                   ▼
       [ dataNormalizer.normalize() ]
                   │
                   ▼ (Jeu de données unifié : CenterEntity[])
          [ AppState.setRawData() ]
                   │
       ┌───────────┴───────────────────────────────┐
       ▼                                           ▼
[ kpiService.computeGlobal() ]            [ mapManager.renderMarkers() ]
       │                                           │
       ▼                                           ▼
[ Affichage Cartes KPI (F2) ]             [ Carte Leaflet initialisée (F1) ]
       │                                           │
       ▼                                           ▼
[ Initialisation Compteur (F7) ]          [ Initialisation Chart.js (F6) ]
```

### 8.1 Cycle de réactivité aux interactions utilisateur
Lorsqu'un utilisateur modifie un filtre ou effectue une recherche :
1. L'élément UI émet un événement `filter:changed` via l'`eventBus`.
2. Le `filterService` recalcule la collection `filteredData`.
3. `AppState` se met à jour.
4. Les abonnés réagissent automatiquement :
   - `mapManager` met à jour la visibilité des marqueurs et clusters.
   - `dashboard` met à jour les chiffres et les badges KPI.
   - `timeChart` redessine les graphiques avec les nouvelles distributions.
   - Si un centre était sélectionné et n'appartient plus au filtre, le `bottomSheet` se replie gracieusement.

---

## 9. Stratégie de résilience & Mode Hors-ligne (Fallback)

Pour parer aux aléas inhérents aux APIs publiques (coupure réseau, indisponibilité de l'infrastructure de la Ville de Paris, quotas, politique CORS stricte), le système intègre une tolérance aux pannes native :

1. **Timeout agressif mais raisonnable :** Chaque requête `fetch` vers l'API OpenData dispose d'un `AbortController` calibré à 6 000 ms.
2. **Bascule transparente :** En cas d'erreur réseau, de code de statut HTTP $\ge 400$ ou de dépassement de délai, le service bascule immédiatement sur les fichiers de secours situés dans `/public/data/*.fallback.geojson`.
3. **Information utilisateur non intrusive :** Un badge discret de statut apparaît dans le pied de page :
   - Mode nominal : `● Données en direct de opendata.paris.fr`.
   - Mode dégradé : `▲ Mode secours local actif (Données synchronisées de sauvegarde)`.
4. **Cache mémoire :** Une fois le jeu de données chargé, il est conservé en mémoire vive pour toute la session de navigation sans réinterroger le réseau lors des filtrages.

---

## 10. Architecture cartographique & Rendu visuel nocturne

### 10.1 Spécifications cartographiques
- **Bibliothèque :** Leaflet.js v1.9+.
- **Fond de carte (Tile Layer) :** `CartoDB.DarkMatter`  
  `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`  
  Attribution : `© OpenStreetMap contributors © CARTO`.
- **Limites de vue (BBox) :** Définies strictement sur l'Île-de-France avec zoom centré sur Paris (`zoom: 12`, `minZoom: 11`, `maxZoom: 18`).

### 10.2 Système de marqueurs néon
Afin de concilier esthétique nocturne et fluidité :
- Utilisation de `L.divIcon` générant des pastilles SVG luminescentes.
- **Code couleur néon par catégorie :**
  - **CHU (Hébergement d'urgence) :** Vert Néon (`#39FF14`) — Priorité maximale la nuit.
  - **CHRS (Réinsertion sociale) :** Jaune Néon (`#FFE600`) — Accompagnement et réinsertion.
  - **SSP (Services sociaux proximité) :** Cyan Électrique (`#00F0FF`) — Orientation et proximité.
  - **CASVP (Centres d'action sociale) :** Violet Clair (`#D946EF`) — Administration sociale.
- **Animation d'accentuation :** Marqueur sélectionné entouré d'une onde concentrique animée en CSS (`pulse-ring`).

---

## 11. Architecture du tableau de bord & Moteur statistique

Le moteur `kpiService.js` applique des agrégations instantanées sur les données filtrées :

$$N_{\text{total}} = \sum c \in \text{FilteredData}$$

$$\text{Capacité}_{\text{lits}} = \sum_{c \in \text{FilteredData}} \text{capacity}(c)$$

$$\text{Couverture Nuit (\%)} = \left( \frac{\sum_{c \in \text{FilteredData}} [c.\text{isNightActive} = \text{true}]}{N_{\text{total}}} \right) \times 100$$

Ces calculs sont exécutés en temps constant négligeable ($< 5\text{ ms}$ pour quelques centaines de structures), garantissant un affichage instantané sans blocage d'interface.

---

## 12. Architecture d'interaction & Expérience utilisateur (UX)

### 12.1 Thème visuel et design system nocturne
- **Arrière-plan principal :** Noir d'encre spatial (`#070A13`) et Bleu nuit profond (`#0F172A`).
- **Surfaces et cartes :** Fond sombre translucide avec effet de flou d'arrière-plan (*Glassmorphism* : `rgba(15, 23, 42, 0.75)`, `backdrop-filter: blur(12px)`).
- **Typographie :** Polices modernes à forte lisibilité : *Inter* ou *Plus Jakarta Sans* pour les textes courants, et police monospace élégante (*JetBrains Mono*) pour les compteurs et données numériques.

### 12.2 Ergonomie du Bottom Sheet
- Composant conçu selon les règles d'ergonomie mobile :
  - **Poignée de glissement tactile (*drag handle*)** visible en haut de la carte.
  - **Transitions CSS matérielles fluides** (`transform: translateY(...)`, `transition: cubic-bezier(0.16, 1, 0.3, 1)`).
  - Évitement des conflits tactiles avec la carte sous-jacente via `stopPropagation()`.

---

## 13. Sécurité, Performance & Accessibilité nocturne

### 13.1 Sécurité
- **Absence de stockage de données sensibles :** Aucune donnée personnelle d'usager n'est collectée ni transmise.
- **Sanitisation stricte du HTML :** Tous les champs textuels issus des GeoJSON (noms, adresses, descriptions) sont systématiquement échappés avant injection dans le DOM ou les popups Leaflet afin de prévenir tout risque de vulnérabilité XSS.
- **Content Security Policy (CSP) recommandée :**
  ```http
  default-src 'self';
  connect-src 'self' https://opendata.paris.fr https://*.basemaps.cartocdn.com;
  img-src 'self' data: https://*.basemaps.cartocdn.com;
  style-src 'self' 'unsafe-inline';
  script-src 'self';
  ```

### 13.2 Performance
- **Poids total des assets :** Poids cible inférieur à 350 Ko (gzippé) hors tuiles cartographiques externes.
- **Rendu graphique asynchrone :** Les tuiles de la carte et les points sont chargés de façon asynchrone pour afficher l'interface et le tableau de bord en moins de 800 ms (First Contentful Paint).

### 13.3 Accessibilité (a11y)
- Ratios de contraste conformes à la norme WCAG 2.1 niveau AAA pour les interfaces sombres.
- Prise en charge de la navigation au clavier (tabulations sur les filtres, touche `Escape` pour fermer le Bottom Sheet).
- Attributs ARIA appliqués sur les panneaux dynamiques (`aria-live="polite"` pour le compteur et les KPIs).

---

## 14. Design d'interface & Contrats d'événements

La communication entre composants indépendants s'effectue au moyen d'un bus d'événements unifié (`eventBus.js`) :

| Événement | Charge utile (Payload) | Émetteur | Destinataires |
| :--- | :--- | :--- | :--- |
| `data:loaded` | `{ centers: CenterEntity[], source: string }` | `openDataService` | `dashboard`, `mapManager`, `timeChart` |
| `data:error` | `{ error: Error, usedFallback: boolean }` | `openDataService` | `toastNotifier`, `footerStatus` |
| `filter:changed` | `{ query: string, types: string[], nightOnly: boolean }` | `searchFilter` | `filterService`, `mapManager`, `dashboard` |
| `center:selected` | `{ center: CenterEntity }` | `mapManager` / `search` | `bottomSheet`, `mapManager` (flyTo) |
| `center:closed` | `null` | `bottomSheet` | `mapManager` (reset highlight) |
| `focus:toggled` | `{ active: boolean }` | `searchFilter` (bouton) | `nightFocusLayer`, `mapManager` |
| `easteregg:triggered` | `{ theme: 'full-moon' }` | `easterEgg` | `main`, `mapManager`, `audioService` |

---

## 15. Architecture de déploiement & Hébergement

L'application étant une Single Page Application statique haute performance, elle est compatible avec l'ensemble des hébergeurs modernes Jamstack :

```
[ Dépôt GitHub ]
       │
       ▼ (Déclenchement automatique sur push main)
[ GitHub Actions / Netlify Build / Vercel ]
       ├── 1. npm ci (Installation dépendances)
       ├── 2. npm run test (Validation des schémas GeoJSON & calculs KPI)
       └── 3. npm run build (Compilation Vite -> /dist)
       │
       ▼
[ Hébergement Edge CDN ] (GitHub Pages / Netlify / Vercel)
       │
       ├── Global CDN Caching (Cache-Control: max-age=3600)
       ├── Certificat SSL/TLS automatique (HTTPS obligatoire)
       └── Compression Brotli / Gzip native
```

---

## 16. Diagrammes de séquence

### 16.1 Initialisation de l'application & Récupération des données

```
Utilisateur        Frontend (Main)     OpenDataService     API Paris v2.1     Fallback Local
    │                     │                   │                   │                 │
    │── Ouvre l'app ─────>│                   │                   │                 │
    │                     │── fetchAllData() ─>│                   │                 │
    │                     │                   │── GET GeoJSON 1 ──>│                 │
    │                     │                   │── GET GeoJSON 2 ──>│                 │
    │                     │                   │<─ [GeoJSON Data] ──│ (ou timeout)    │
    │                     │                   │                   │                 │
    │                     │                   │── (si erreur) ────┼── Charge local ─>│
    │                     │                   │<──────────────────┼── [Fallback OK] ─│
    │                     │<─ [Normalized] ───│                   │                 │
    │                     │                   │                   │                 │
    │                     │── Initialise Carte (F1)               │                 │
    │                     │── Rend Dashboard & KPIs (F2)          │                 │
    │                     │── Anime Compteur direct (F7)          │                 │
    │<─ Interface prête ──│                   │                   │                 │
```

### 16.2 Filtrage dynamique et sélection d'un centre (Bottom Sheet)

```
Utilisateur           SearchFilter          EventBus         FilterService       MapManager        BottomSheet
    │                       │                   │                  │                  │                 │
    │── Coche "CHU" ───────>│                   │                  │                  │                 │
    │                       │── emit("filter") ─>│                  │                  │                 │
    │                       │                   │── apply() ──────>│                  │                 │
    │                       │                   │<─ [Filtered] ────│                  │                 │
    │                       │                   │                                     │                 │
    │                       │                   │── emit("data:filtered") ───────────>│                 │
    │                       │                   │                                     │ (maj marqueurs) │
    │                       │                   │                                                       │
    │── Clic Marqueur Carte ─────────────────────────────────────────────────────────>│                 │
    │                                                                                 │── emit("select")│
    │                                                                                 │       │         │
    │                                                                                 │       ▼         │
    │                                                                                 │   Affiche fiche │
    │<─ Panneau Bottom Sheet déplié avec détails du centre ───────────────────────────┼─────────────────│
```

### 16.3 Activation du Mode Focus Nuit (F5)

```
Utilisateur           Bouton Focus Nuit       EventBus          NightFocusLayer        MapManager
    │                         │                   │                    │                   │
    │── Clic "Mode Nuit" ────>│                   │                    │                   │
    │                         │── emit("focus") ─>│                    │                   │
    │                         │                   │── applyFocus() ───>│                   │
    │                         │                   │                    ├── Atténue points jour (15%)
    │                         │                   │                    ├── Accentue lueurs néon nuit
    │                         │                   │                    └── Applique filtre d'obscurité
    │<─ Carte en immersion nocturne renforcée ────┴────────────────────┴───────────────────│
```

---

## 17. Stratégie d'évolutivité (Scalability)

Bien que l'architecture MVP réponde intégralement au périmètre d'un concours et d'un usage grand public fluide, elle est prête pour une montée en charge future :

| Étape d'évolution | Architecture technique | Capacité de traitement |
| :--- | :--- | :--- |
| **Phase MVP (Actuelle)** | SPA Jamstack statique, exécution client, requêtes API Paris directes + cache mémoire | 50 000+ visiteurs / jour (coût serveur 0 €, bande passante déportée sur le CDN). |
| **Phase V1.5 (Optimisation)** | Proxy Serverless (Cloudflare Worker ou Netlify Function) avec mise en cache CDN (TTL 1h) | Évite les limitations de quota d'OpenData Paris en cas de pic de trafic viral. |
| **Phase V2 (Extensibilité)** | Ajout d'une base de données géospatiale (PostGIS / Supabase) pour intégrer d'autres métropoles (Lyon, Marseille, etc.) | Visualisation nocturne multi-villes à l'échelle nationale. |

---

## 18. Matrice de périmètre : MVP vs V2

| Fonctionnalité | Réf. Cahier des charges | Périmètre MVP (Phase actuelle) | Évolution V2 (Futur) |
| :--- | :--- | :--- | :--- |
| **Carte Nocturne Interactive** | F1 | Leaflet, tuiles CartoDB Dark Matter, marqueurs néon | Moteur 3D Mapbox GL JS / Deck.gl avec bâtiments extrudés |
| **Tableau de bord statistique** | F2 | 3 cartes KPI en temps réel (Centres, Lits, Ratios) | Export des données en CSV/PDF et comparaison inter-arrondissements |
| **Recherche & Filtrage** | F3 | Recherche textuelle (nom, rue, arr.) + 4 filtres par type | Filtre par rayon kilométrique GPS autour de l'utilisateur |
| **Fiche détaillée (Bottom Sheet)** | F4 | Fiche mobile-first glissante avec coordonnées et lits | Calcul d'itinéraire multimodal en temps réel (RATP/Noctilien) |
| **Mode Focus Nuit** | F5 | Mise en avant néon des accueils d'urgence nocturnes | Simulation de l'heure en temps réel (slider chronologique horaire) |
| **Graphiques temporels** | F6 | Histogramme Chart.js par arrondissement | Graphique prédictif d'affluence basé sur l'historique météo/saison |
| **Compteur dynamique** | F7 | Compteur numérique animé avec pulsation cardiaque néon | Données d'occupation transmises par capteurs IoT en temps réel |
| **Easter Egg Clair de lune** | F8 | Animation céleste poétique et thème argenté débloqué | Mini-jeu d'orientation nocturne interactif |

---

## 19. Hypothèses & Questions ouvertes (Assumptions & Open Questions)

### 19.1 Hypothèses retenues (Assumptions)
1. **Disponibilité des APIs OpenData Paris v2.1 :** Les endpoints GeoJSON mentionnés dans `cahier_charge.md` fournissent les géométries `Point` valides en projection standard EPSG:4326 (WGS84).
2. **Attribution de la capacité en lits :** Dans le jeu de données `hebergements-casvp`, le nombre de places est extrait en priorité des attributs quantitatifs disponibles ; en l'absence de valeur explicite pour un centre donné, une valeur par défaut estimée ou la mention « Capacité non communiquée » est affichée sans bloquer le calcul global.
3. **Identification des structures nocturnes :** Les structures de type `CHU` (Centre d'Hébergement d'Urgence) et les accueils de nuit sont conventionnellement considérés comme assurant une veille nocturne active (24h/24 ou accueil de soirée).
4. **Environnement d'exécution :** L'application cible les navigateurs modernes supportant ES6 Modules, Fetch API, CSS Grid/Flexbox et CSS Variables, couvrant $>98\%$ du parc utilisateur actuel.

### 19.2 Questions ouvertes (Open Questions)
1. **Fréquence d'actualisation des données de la Ville de Paris :** Les flux `opendata.paris.fr` sont généralement mis à jour de manière hebdomadaire ou mensuelle. Une vérification de la fraîcheur du jeu local de secours (fallback) devra être planifiée périodiquement.
2. **Enrichissement des données de contact :** Certaines fiches de centres d'action sociale peuvent comporter des numéros génériques de standard. Il sera envisageable en V2 d'associer un numéro d'urgence direct (ex: 115) pour les orientations immédiates.

---

*Document d’architecture technique rédigé avec rigueur et fidélité absolue au cahier des charges du projet « Visualisez l'OpenData au clair de lune » (Défi Apside).*
