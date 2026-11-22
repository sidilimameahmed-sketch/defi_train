# Visualisez l'OpenData au clair de lune — Master Implementation Plan

**Projet :** Visualisez l'OpenData au clair de lune  
**Partenaire :** Apside — **Thématique :** Futur des données ouvertes — **Sous-thème :** La Nuit  
**Version :** 1.0.0 (Plan directeur de développement et de livraison)  
**Document de référence coordonnant :** `architecture.md`, `api-contract.md`, `backend-plan.md`, `frontend-plan.md` et `infra-plan.md`  

---

## 1. Principes Directeurs du Master Plan

Le présent Master Plan orchestre l'ensemble des chantiers de réalisation pour livrer l'application complète, testée et déployée selon les normes du défi Apside.

1. **Approche Contract-First & Données Réelles :** Aucun développement d'interface ne dérive des contrats de données (`api-contract.md`) ni des spécifications des GeoJSON de la Ville de Paris.
2. **Livraison Incrémentale & Démonstrable :** Chaque phase produit des livrables fonctionnels immédiatement testables dans le navigateur.
3. **Parallélisme Maîtrisé :** Les travaux sur les services de données (ingestion, normalisation, tests) et sur la présentation (composants, CSS néon, carte) s'exécutent de façon synchronisée avec des points de synchronisation (*Handshake Checkpoints*).
4. **Focalisation stricte sur le périmètre (F1 à F8) :** Aucune fonctionnalité hors-sujet n'est tolérée, préservant la légèreté et la poésie nocturne de l'expérience utilisateur.

---

## 2. Calendrier Global de Réalisation (Sprint Roadmap)

Conformément au calendrier prévisionnel du cahier des charges (Section 8), le cycle de développement est découpé en 8 étapes coordonnées :

| Phase | Intitulé & Focus | Effort Estimé | Dépendances |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Socle Technique, Scaffolding & Thème Nocturne | 1 jour | Spécifications validées |
| **Phase 2** | Ingestion OpenData, Normalisation & Fallback de Secours | 1 jour | Phase 1 |
| **Phase 3** | Carte Nocturne Interactive & Marqueurs Néon (F1) | 1.5 jour | Phase 2 |
| **Phase 4** | Tableau de Bord Statistique & Compteur Dynamique (F2, F7) | 1 jour | Phase 2, Phase 3 |
| **Phase 5** | Recherche, Filtres Multicritères & Mode Focus Nuit (F3, F5) | 1.5 jour | Phase 3, Phase 4 |
| **Phase 6** | Bottom Sheet Coulissant & Graphiques Chart.js (F4, F6) | 1 jour | Phase 3, Phase 5 |
| **Phase 7** | Easter Egg « Clair de Lune » & Finitions Visuelles (F8) | 0.5 jour | Phase 5, Phase 6 |
| **Phase 8** | Tests Globaux, CI/CD, Documentation & Déploiement | 0.5 jour | Toutes phases antérieures |
| **Total** | **Livraison complète du système MVP** | **8 jours** | Prêt pour démo & jury |

---

## 3. Détail des Phases d'Exécution

---

### Phase 1 — Socle Technique, Scaffolding & Thème Nocturne

**Objectif :** Mettre en place l'environnement de développement, la structure modulaire, les variables graphiques nocturnes et le conteneur principal.

- **Tâches d'Ingénierie & Données :**
  - Initialisation du projet Vite avec structure modulaire (`src/`, `public/`, `scripts/`).
  - Configuration de `package.json` et scripts de build.
  - Définition du fichier de configuration global `src/config/api.config.js`.
- **Tâches Frontend :**
  - Rédaction de la page `index.html` sémantique et accessible.
  - Création du Design System CSS nocturne (`variables.css`, `typography.css`, `animations.css`) : fond `#070A13`, contrastes élevés, typographies *Inter* et *JetBrains Mono*.
  - Montage du composant `header.js` avec logo Apside et icône de lune interactive.
- **Tâches Infrastructure :**
  - Configuration de `vite.config.js` avec optimisations de bundle et base relative.
- **Point de Contrôle (Handshake Checkpoint 1) :**
  - [x] L'application se lance sur `http://localhost:5173` sans erreur de console.
  - [x] La mise en page sombre et les effets de verre (*Glassmorphism*) sont rendus fidèlement sur desktop et mobile.

---

### Phase 2 — Ingestion OpenData, Normalisation & Fallback de Secours

**Objectif :** Récupérer les données officielles de Paris, garantir leur normalisation et sceller la tolérance aux pannes.

- **Tâches d'Ingénierie & Données :**
  - Création du script d'ingestion `scripts/fetch-fallback-data.mjs` interrogeant les 2 endpoints d'opendata.paris.fr.
  - Génération et validation des fichiers de secours dans `public/data/*.fallback.geojson`.
  - Développement de `src/services/openDataService.js` avec `AbortController` (timeout 6 s) et bascule automatique sur les fallbacks.
  - Développement de `src/services/dataNormalizer.js` avec conversion vers le modèle canonique `CenterEntity` et sanitisation anti-XSS.
- **Tâches Frontend :**
  - Création du composant d'état de chargement (*Skeleton loader* sombre et discret).
  - Écoute de l'événement `data:loaded` sur l'Event Bus pour masquer les chargeurs.
- **Tâches de Test :**
  - Tests unitaires Vitest vérifiant que chaque centre normalisé possède un ID, des coordonnées et une catégorie valide.
- **Point de Contrôle (Handshake Checkpoint 2) :**
  - [x] Les données réelles sont récupérées avec succès depuis l'API de Paris.
  - [x] En simulant une coupure réseau, l'application bascule silencieusement sur le fichier local de secours en $< 100\text{ ms}$.

---

### Phase 3 — Carte Nocturne Interactive & Marqueurs Néon (Fonctionnalité F1)

**Objectif :** Intégrer le moteur cartographique Leaflet et afficher l'ensemble des centres avec des marqueurs lumineux contrastés.

- **Tâches Frontend & Cartographie :**
  - Intégration de Leaflet.js dans `src/map/mapManager.js` avec le fond de carte *CartoDB Dark Matter*.
  - Création de la fabrique de marqueurs `src/map/markerFactory.js` avec anneaux SVG lumineux :
    - Vert néon (`#39FF14`) pour `CHU`.
    - Jaune néon (`#FFE600`) pour `CHRS`.
    - Cyan (`#00F0FF`) pour `SSP`.
    - Magenta (`#D946EF`) pour `CASVP`.
  - Implémentation du système de clustering sombre pour les zones denses de Paris.
  - Liaison du clic sur marqueur pour émettre l'événement `center:selected`.
- **Point de Contrôle (Handshake Checkpoint 3) :**
  - [x] La carte de Paris s'affiche avec son style sombre immersif.
  - [x] L'ensemble des points d'hébergement et d'action sociale apparaissent sous forme de halos néon distincts.
  - [x] Le framerate reste fluide (60 FPS) lors du zoom et du déplacement.

---

### Phase 4 — Tableau de Bord Statistique & Compteur Dynamique (Fonctionnalités F2 & F7)

**Objectif :** Calculer et animer les indicateurs clés de la vie nocturne parisienne.

- **Tâches d'Ingénierie & Données :**
  - Développement de `src/services/kpiService.js` calculant le total des structures, la capacité globale en lits et le taux de couverture nocturne.
- **Tâches Frontend :**
  - Intégration de `src/components/dashboard.js` affichant les 3 cartes KPI en haut de l'écran.
  - Intégration de `src/components/liveCounter.js` (F7) avec défilement numérique fluide et effet de pulsation lumineuse périodique (*heartbeat glow*).
- **Point de Contrôle (Handshake Checkpoint 4) :**
  - [x] Les 3 indicateurs majeurs s'affichent avec des chiffres exacts dès le chargement des données.
  - [x] Le compteur de lits s'incrémente avec une animation visuelle captivante.

---

### Phase 5 — Recherche, Filtres Multicritères & Mode Focus Nuit (Fonctionnalités F3 & F5)

**Objectif :** Permettre l'exploration ciblée des centres et mettre en œuvre l'innovation visuelle du Focus Nuit.

- **Tâches d'Ingénierie & Données :**
  - Développement de `src/services/filterService.js` prenant en charge la recherche plein texte et le filtrage multi-tags.
- **Tâches Frontend :**
  - Création de la barre d'outils `src/components/searchFilter.js` :
    - Champ de recherche par nom, rue ou arrondissement.
    - Badges de filtrage par type (`CHU`, `CHRS`, `SSP`, `CASVP`).
    - Bouton à bascule pour le **Mode Focus Nuit (F5)**.
  - Animation de transition : atténuation des structures diurnes et surbrillance intense des centres d'urgence ouverts la nuit.
  - Synchronisation automatique avec la carte et le tableau de bord via l'Event Bus.
- **Point de Contrôle (Handshake Checkpoint 5) :**
  - [x] Taper "14ème" ou "René Coty" filtre instantanément la carte et met à jour les KPIs.
  - [x] L'activation du Mode Focus Nuit plonge la ville dans l'obscurité en faisant briller uniquement les centres nocturnes.

---

### Phase 6 — Bottom Sheet Coulissant & Graphiques Chart.js (Fonctionnalités F4 & F6)

**Objectif :** Fournir le détail complet d'un centre au clic et donner une lecture analytique par arrondissement.

- **Tâches Frontend :**
  - Création du composant mobile-first `src/components/bottomSheet.js` (F4) :
    - Gestion des gestes tactiles (*touch drag*) et bouton de fermeture.
    - Affichage du nom, de la catégorie, de la capacité, du statut nocturne, de l'adresse et du téléphone cliquable.
  - Intégration de Chart.js dans `src/components/timeChart.js` (F6) :
    - Histogramme de la capacité par arrondissement et anneau de répartition jour/nuit.
    - Thème sombre personnalisé avec grilles discrètes et étiquettes lisibles.
- **Point de Contrôle (Handshake Checkpoint 6) :**
  - [x] Le clic sur un marqueur ouvre le Bottom Sheet avec animation fluide et recentre la carte.
  - [x] Le panneau graphique s'ouvre sur commande et présente des visualisations interactives cohérentes.

---

### Phase 7 — Easter Egg « Clair de Lune » & Finitions Visuelles (Fonctionnalité F8)

**Objectif :** Intégrer la touche de poésie et d'humour nocturne demandée par le jury Apside.

- **Tâches Frontend :**
  - Création de `src/components/easterEgg.js` :
    - Déclencheur : 3 clics consécutifs sur la lune du header ou saisie clavier du mot secret `lune`.
    - Effet visuel : Calque Canvas d'étoiles filantes animées et passage temporaire de l'interface en mode « Pleine Lune Argentée ».
    - Message hommage à la solidarité nocturne et au défi Apside.
  - Vérification de l'accessibilité globale (contraste WCAG AAA, navigation clavier, attributs ARIA).
- **Point de Contrôle (Handshake Checkpoint 7) :**
  - [x] L'Easter Egg se déclenche de manière ludique sans perturber le fonctionnement de l'application.

---

### Phase 8 — Tests Globaux, CI/CD & Déploiement Production

**Objectif :** Valider la conformité de l'ensemble des livrables et publier l'application en ligne.

- **Tâches de Déploiement & Qualité :**
  - Mise en place du workflow GitHub Actions `.github/workflows/deploy.yml`.
  - Exécution du build de production (`npm run build`).
  - Déploiement sur GitHub Pages / Netlify avec certificat HTTPS actif.
  - Rédaction du `README.md` complet (instructions d'exécution, sources de données, lien vers la démo en ligne).
  - Préparation du support de démonstration pour le jury Apside.
- **Point de Contrôle Final (Acceptation Globale) :**
  - [x] L'application est accessible publiquement via son URL HTTPS.
  - [x] 100% des exigences du cahier des charges (F1 à F8) sont validées et documentées.

---

*Ce Master Plan constitue la feuille de route exhaustive assurant la réussite du projet « Visualisez l'OpenData au clair de lune ».*
