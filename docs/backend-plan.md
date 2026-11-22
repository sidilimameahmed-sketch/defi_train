# Visualisez l'OpenData au clair de lune — Backend & Data Engineering Plan

**Projet :** Visualisez l'OpenData au clair de lune  
**Partenaire :** Apside — **Thématique :** Futur des données ouvertes — **Sous-thème :** La Nuit  
**Version :** 1.0.0 (Spécifications de l'ingénierie des données & Services Backend)  
**Document compagnon de :** `architecture.md` et `api-contract.md`  

---

## 1. Objectif & Rôle du Document

Ce document formalise l'organisation, les responsabilités et la planification de l'ingénierie des données et des services logiques pour le projet **« Visualisez l'OpenData au clair de lune »**.

Bien que l'application soit conçue selon le paradigme moderne **Jamstack / Client-Centric** (permettant une exécution autonome dans le navigateur et un déploiement statique ultra-léger sur GitHub Pages ou Netlify), la robustesse du système repose sur un ensemble de services d'ingénierie des données rigoureusement spécifiés :
- Un pipeline d'ingestion et d'extraction automatisée des flux GeoJSON de la Ville de Paris.
- Un générateur de jeux de données de secours (*Fallback Harvester*).
- Des services de validation, normalisation et sanitisation des schémas GeoJSON.
- Un moteur d'agrégation statistique (KPIs, distribution des lits, ratios de couverture nocturne).
- Une configuration de proxy de développement local (pour s'affranchir des limitations CORS éventuelles).
- Une chaîne de validation automatisée en intégration continue (CI/CD).

**Sources de vérité du projet :**
- Contrats de données et schémas : `api-contract.md`.
- Architecture globale et principes de résilience : `architecture.md`.
- Exigences fonctionnelles et thématiques : `cahier_charge.md`.

---

## 2. Périmètre de Responsabilité (Ownership)

L'équipe Backend / Data Engineering est responsable exclusive des périmètres suivants :

- **Scripts d'ingestion & synchronisation :** `scripts/fetch-fallback-data.mjs` et outils CLI de validation des données OpenData.
- **Jeux de données de référence :** `public/data/*.fallback.geojson`.
- **Services métier centraux (Core Data Services) :**
  - `src/services/openDataService.js` : Client HTTP Fetch, gestion des timeouts et bascule de secours.
  - `src/services/dataNormalizer.js` : Validation Zod/JSON Schema, nettoyage et cartographie vers `CenterEntity`.
  - `src/services/kpiService.js` : Moteur de calcul statistique et agrégations temporelles/spatiales.
  - `src/services/filterService.js` : Moteur de filtrage multicritères et sélection nocturne.
- **Sécurité et conformité des données :** Sanitisation des chaînes de caractères issues des APIs externes pour prévenir les injections XSS.
- **Tests d'intégrité et pipelines de données :** Tests unitaires des calculateurs et tests d'intégration des requêtes API.

---

## 3. Environnement d'Exécution & Outils

```bash
# Exécution du serveur de développement local avec proxy API
npm run dev

# Exécution du script d'ingestion des données de secours (Fallback Harvester)
npm run data:sync

# Exécution de la suite de tests des services de données
npm run test:data
```

### Dépendances & Outils techniques :
- **Node.js :** v18+ LTS (moteur d'ingestion et d'exécution des tests).
- **Zod :** Validation stricte des schémas GeoJSON lors de la normalisation.
- **DOMPurify (ou sanitize-html) :** Nettoyage préventif des champs textuels non maîtrisés issus de l'OpenData.
- **Vitest :** Exécution ultra-rapide des tests unitaires sur les calculs KPI et les filtres.

---

## 4. Règles d'Ingénierie & Principes de Conception

1. **Immutabilité des données brutes :** Les flux GeoJSON récupérés ne sont jamais mutés directement. Ils traversent le pipeline `dataNormalizer` pour produire des objets `CenterEntity` neufs et figés (*Object.freeze* en environnement de test).
2. **Tolérance aux pannes & Zéro Crash :** Aucune indisponibilité de l'API Paris OpenData ne doit provoquer d'écran blanc. L'intercepteur de secours bascule de façon transparente vers les fichiers locaux.
3. **Pureté des fonctions de calcul :** Les méthodes de `kpiService` et `filterService` sont des fonctions pures sans état interne persistant. À mêmes entrées, elles produisent exactement les mêmes métriques.
4. **Sanitisation systématique :** Tout contenu textuel provenant de l'extérieur est nettoyé avant d'être transmis à la couche de présentation.
5. **Absence d'éléments superflus :** Conformément aux règles strictes de non-pollution par l'ancien projet, aucune fonctionnalité étrangère (gestion de sessions utilisateurs, authentification JWT, bases relationnelles/NoSQL lourdes type MongoDB, gestion de caisse ou factures) n'est implémentée.

---

## 5. Architecture Détaillée des Modules de Données

```
src/services/
├── openDataService.js       # Client réseau résilient (Fetch + AbortController + Fallback)
├── dataNormalizer.js        # Parser GeoJSON, mapping et validation des types
├── kpiService.js            # Moteur analytique (calcul des 3 KPIs F2, données Chart.js F6)
└── filterService.js         # Moteur de recherche plein texte, filtres par type et Focus Nuit F5
```

### 5.1 `openDataService.js` (Client Réseau Résilient)
- **Responsabilités :**
  - Exécute en parallèle les deux requêtes HTTP GET vers l'API Explore v2.1 de Paris :
    1. Endpoint SSP & CASVP.
    2. Endpoint Hébergements CASVP (CHU / CHRS).
  - Contrôle le délai de réponse via `AbortController` (timeout fixé à 6 000 ms).
  - En cas d'exception réseau (status $\ge 400$, timeout, erreur CORS), déclenche automatiquement le chargement local des fichiers `/public/data/*.fallback.geojson`.
  - Transmet les flux bruts au `dataNormalizer`.

### 5.2 `dataNormalizer.js` (Pipeline de Normalisation & Sanitisation)
- **Responsabilités :**
  - Détecte l'origine du GeoJSON et extrait les géométries `Point` valides.
  - Normalise les incohérences de nommage de champs :
    - `nom_structure` ou `nom_etablissement` $\rightarrow$ `name`.
    - `type_structure` ou `type_etablissement` $\rightarrow$ `category` (`CHU`, `CHRS`, `SSP`, `CASVP`).
    - `capacite_lits` $\rightarrow$ `capacity` (entier converti ou 0 si absent).
  - Détermine le statut nocturne (`isNightActive`) :
    - Vrai si `type_etablissement === 'CHU'` ou si le champ d'horaires mentionne un accueil de nuit / 24h/24.
  - Assainit l'adresse, le téléphone et la description via une routine de sanitisation anti-XSS.

### 5.3 `kpiService.js` (Moteur d'Agrégation Analytique)
- **Responsabilités :**
  - Calcule instantanément le volume total de structures actives.
  - Calcule la somme cumulée des places d'hébergement disponibles.
  - Calcule le pourcentage de couverture nocturne globale et par arrondissement.
  - Prépare les séries temporelles et spatiales adaptées aux spécifications de `Chart.js` (F6).

### 5.4 `filterService.js` (Moteur de Recherche & Focus Nuit)
- **Responsabilités :**
  - Implémente une recherche textuelle tolérante (insensible aux majuscules et aux accents).
  - Filtre selon les catégories sélectionnées par l'utilisateur.
  - Gère l'état d'accentuation nocturne pour le mode « Focus Nuit » (F5) en isolant les centres ouverts après 20h00.

---

## 6. Plan d'Implémentation Étape par Étape (Phase-by-Phase Backend Work)

### Étape 1 — Pipeline d'Ingestion & Script de Fallback
- **Livrables :**
  - Script Node.js `scripts/fetch-fallback-data.mjs` interrogeant l'API Explore v2.1 de Paris.
  - Fichiers locaux de secours enregistrés dans `public/data/coordonnees-ssp-et-casvp.fallback.geojson` et `public/data/hebergements-casvp.fallback.geojson`.
  - Commande `npm run data:sync` configurée dans `package.json`.
- **Critères d'acceptation :** Les fichiers GeoJSON locaux sont générés, validés syntaxiquement et exploitables hors-ligne.

### Étape 2 — Client Réseau & Mécanisme de Résilience
- **Livrables :**
  - Module `src/services/openDataService.js`.
  - Implémentation du double appel `Promise.allSettled` avec `AbortController`.
  - Gestion transparente de la bascule vers le jeu local en cas de défaillance réseau.
- **Critères d'acceptation :** En coupant l'accès réseau ou en simulant un statut 500, l'application charge sans erreur les données locales en moins de 100 ms.

### Étape 3 — Normalisation des Données & Sanitisation
- **Livrables :**
  - Module `src/services/dataNormalizer.js`.
  - Validateur de structure et convertisseur vers l'interface canonique `CenterEntity`.
  - Filtre de sanitisation des champs HTML.
- **Critères d'acceptation :** 100% des entités retournées possèdent un `id`, une catégorie valide, des coordonnées géographiques `[lat, lng]` et des chaînes de caractères assainies.

### Étape 4 — Moteur d'Agrégation Statistique (KPIs & Visualisations)
- **Livrables :**
  - Module `src/services/kpiService.js`.
  - Fonctions pures de calcul des totaux, capacités et pourcentages.
  - Formateur des données pour les graphiques par arrondissement.
- **Critères d'acceptation :** Tests unitaires validant l'exactitude mathématique des agrégations sur des jeux de données témoins.

### Étape 5 — Moteur de Recherche & Filtrage Avancé
- **Livrables :**
  - Module `src/services/filterService.js`.
  - Prise en charge de la recherche multi-mots, du filtrage par catégories et du sélecteur nocturne.
- **Critères d'acceptation :** Temps de réponse du filtrage inférieur à 5 ms pour une collection de plusieurs centaines de points.

### Étape 6 — Automatisation des Tests & Pipeline CI
- **Livrables :**
  - Suite de tests unitaires Vitest couvrant `openDataService`, `dataNormalizer`, `kpiService` et `filterService`.
  - Workflow GitHub Actions vérifiant l'intégrité des scripts d'ingestion à chaque pull request.
- **Critères d'acceptation :** Couverture de tests supérieure à 90% sur la logique de traitement des données.

---

*Ce document de Backend & Data Engineering Plan garantit une architecture de données robuste, pérenne et strictement conforme au cahier des charges du projet « Visualisez l'OpenData au clair de lune ».*
