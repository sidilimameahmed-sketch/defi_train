# Visualisez l'OpenData au clair de lune — API & Data Contract

**Projet :** Visualisez l'OpenData au clair de lune  
**Partenaire :** Apside — **Thématique :** Futur des données ouvertes — **Sous-thème :** La Nuit  
**Version :** 1.0.0 (Spécifications contractuelles des données & APIs)  
**Document compagnon de :** `architecture.md`  

Ce document constitue la source unique de vérité (*Source of Truth*) pour l'ensemble des contrats d'interfaces de données, des formats d'échange GeoJSON, des spécifications des APIs OpenData consommées, des clients de données internes, des DTOs normalisés et des structures d'erreurs du système.

---

## Table des Matières

1. [Conventions générales & Formats](#1-conventions-générales--formats)
2. [APIs Externes consommées (Paris OpenData Explore v2.1)](#2-apis-externes-consommées-paris-opendata-explore-v21)
   - 2.1 Endpoint 1 : Coordonnées des SSP et CASVP
   - 2.2 Endpoint 2 : Hébergements CASVP (CHU / CHRS)
3. [Contrat du Client de Données & Service Local (Data Layer)](#3-contrat-du-client-de-données--service-local-data-layer)
4. [Contrat de Résilience & Fallback Local](#4-contrat-de-résilience--fallback-local)
5. [Contrat du Moteur de Recherche & Filtrage (Filter Service)](#5-contrat-du-moteur-de-recherche--filtrage-filter-service)
6. [Contrat du Moteur Statistique & KPIs (Analytics Engine)](#6-contrat-du-moteur-statistique--kpis-analytics-engine)
7. [Contrat d'Événements Applicatifs (Event Bus Pub/Sub)](#7-contrat-dévénements-applicatifs-event-bus-pubsub)
8. [Annexe A — Modèles de Données & DTOs Partagés](#annexe-a--modèles-de-données--dtos-partagés)
9. [Annexe B — Codes d'Erreurs & Gestion des Anomalies](#annexe-b--codes-derreurs--gestion-des-anomalies)

---

## 1. Conventions générales & Formats

### 1.1 Sources & Protocoles
L'application consomme les données au format standard international **GeoJSON (RFC 7946)** via des requêtes HTTP GET sécurisées (`HTTPS`).

```
Plateforme OpenData : https://opendata.paris.fr
API Version         : Explore v2.1
Format de transfert : application/geo+json; charset=utf-8
Projection spatiale : EPSG:4326 (WGS84 - [Longitude, Latitude])
```

### 1.2 Enveloppe de Réponse Interne (Standard Service Envelope)
Pour harmoniser la consommation des données (qu'elles proviennent du réseau en direct, du cache mémoire ou du fallback local), tous les services internes encapsulent leurs retours selon cette structure standardisée :

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "source": "api" | "fallback" | "cache",
    "timestamp": "2026-11-22T02:00:00.000Z",
    "totalCount": 184
  }
}
```

En cas d'anomalie :

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "API_NETWORK_FAILURE",
    "message": "Impossible de joindre le serveur opendata.paris.fr.",
    "details": {
      "endpoint": "coordonnees-ssp-et-casvp",
      "status": 503
    }
  },
  "meta": {
    "source": "error",
    "timestamp": "2026-11-22T02:00:00.000Z"
  }
}
```

### 1.3 Types de Champs Standards
- **ID :** Chaîne de caractères unique préfixée (`"ssp-14"`, `"heb-28"`).
- **Coordinates :** Tableau de nombres `[longitude, latitude]` selon la norme GeoJSON RFC 7946.
- **Timestamp :** Chaîne ISO 8601 UTC (`"2026-11-22T02:00:00.000Z"`).
- **Arrondissement :** Entier de 1 à 20 représentant les arrondissements municipaux parisiens.
- **Capacity :** Entier $\ge 0$ représentant le nombre de places/lits autorisés.

---

## 2. APIs Externes consommées (Paris OpenData Explore v2.1)

L'application interroge deux jeux de données distincts hébergés sur la plateforme OpenData de la Ville de Paris.

### 2.1 Endpoint 1 : Coordonnées des SSP et CASVP

Fournit l'emplacement géographique et les caractéristiques des Services Sociaux de Proximité (SSP) et des Centres d'Action Sociale de la Ville de Paris (CASVP).

```http
GET https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/coordonnees-ssp-et-casvp/exports/geojson
```

#### Paramètres de Requête (Query Parameters)
| Paramètre | Type | Valeur par défaut | Description |
| :--- | :--- | :--- | :--- |
| `lang` | `string` | `fr` | Langue des métadonnées |
| `timezone` | `string` | `Europe/Paris` | Fuseau horaire pour les calculs d'horaires |

#### Structure de Réponse Brute (GeoJSON FeatureCollection)
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [2.38451, 48.86123]
      },
      "properties": {
        "id": "ssp_11",
        "nom_structure": "Service Social de Proximité - 11ème arrondissement",
        "type_structure": "SSP",
        "adresse": "130 Avenue Ledru-Rollin",
        "code_postal": "75011",
        "arrondissement": 11,
        "telephone": "01 53 36 28 00",
        "horaires": "Du lundi au vendredi de 8h30 à 17h00",
        "ouvert_nuit": false
      }
    }
  ]
}
```

---

### 2.2 Endpoint 2 : Hébergements CASVP (CHU / CHRS)

Fournit l'emplacement, les capacités d'accueil et le type de public des Centres d'Hébergement d'Urgence (CHU) et Centres d'Hébergement et de Réinsertion Sociale (CHRS) gérés ou conventionnés par le CASVP.

```http
GET https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/hebergements-casvp/exports/geojson
```

#### Paramètres de Requête (Query Parameters)
| Paramètre | Type | Valeur par défaut | Description |
| :--- | :--- | :--- | :--- |
| `lang` | `string` | `fr` | Langue des métadonnées |
| `timezone` | `string` | `Europe/Paris` | Fuseau horaire pour les calculs d'horaires |

#### Structure de Réponse Brute (GeoJSON FeatureCollection)
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [2.36892, 48.83541]
      },
      "properties": {
        "id": "heb_13_01",
        "nom_etablissement": "CHU René Coty",
        "type_etablissement": "CHU",
        "gestionnaire": "CASVP",
        "adresse": "24 Boulevard René Coty",
        "code_postal": "75014",
        "arrondissement": 14,
        "capacite_lits": 75,
        "public_accueilli": "Hommes isolés / Urgence sociale",
        "accueil_nuit": true,
        "telephone": "01 43 27 12 34",
        "statut_nuit": "Actif 24h/24"
      }
    }
  ]
}
```

---

## 3. Contrat du Client de Données & Service Local (Data Layer)

Le module `openDataService.js` orchestre la récupération, l'assemblage et la normalisation des deux flux GeoJSON.

### 3.1 Méthode `openDataService.fetchAllData()`
- **Entrée :** `options?: { forceRefresh?: boolean, timeoutMs?: number }`
- **Sortie :** `Promise<ServiceResponse<UnifiedDataset>>`

#### Structure de `UnifiedDataset`
```typescript
interface UnifiedDataset {
  centers: CenterEntity[];
  metadata: {
    fetchedAt: string;        // ISO 8601
    source: 'live_api' | 'local_fallback';
    sspCount: number;
    casvpCount: number;
    chuCount: number;
    chrsCount: number;
    totalCenters: number;
    totalBedCapacity: number;
  };
}
```

---

## 4. Contrat de Résilience & Fallback Local

Lorsque l'API publique de la Ville de Paris est inaccessible (timeout $\ge 6000\text{ ms}$, coupure réseau ou erreur HTTP), le système bascule de façon transparente sur les fichiers statiques de secours embarqués dans l'application :

| Source de secours | Chemin du fichier asset | Format |
| :--- | :--- | :--- |
| Fallback SSP & CASVP | `/public/data/coordonnees-ssp-et-casvp.fallback.geojson` | GeoJSON FeatureCollection |
| Fallback Hébergements | `/public/data/hebergements-casvp.fallback.geojson` | GeoJSON FeatureCollection |

#### Comportement garanti :
- Déclenchement automatique sans intervention de l'utilisateur.
- Pas de crash applicatif : l'interface se charge intégralement.
- Notification non-bloquante émise via l'Event Bus (`data:fallback_used`).

---

## 5. Contrat du Moteur de Recherche & Filtrage (Filter Service)

Le module `filterService.js` applique en mémoire les critères de recherche et les filtres d'état nocturne.

### 5.1 Méthode `filterService.applyFilters()`
- **Signature :** `applyFilters(dataset: CenterEntity[], criteria: FilterCriteria): CenterEntity[]`

#### Structure de `FilterCriteria`
```typescript
interface FilterCriteria {
  searchTerm: string;                  // Chaîne libre (insensible à la casse et aux accents)
  categories: ('CHU' | 'CHRS' | 'SSP' | 'CASVP')[]; // Typologies cochées (OU logique)
  arrondissements: number[];           // Arrondissements sélectionnés (1 à 20)
  nightFocusOnly: boolean;             // Si true, ne conserve que isNightActive === true
}
```

#### Règles de filtrage :
1. **Recherche textuelle :** Comparaison sur `name`, `address` et nom d'arrondissement (ex: "11e", "11ème", "Ledru-Rollin").
2. **Typologies :** Si la liste `categories` est vide, toutes les catégories sont admises. Sinon, le centre doit appartenir à l'une des catégories sélectionnées.
3. **Mode Focus Nuit :** Si `nightFocusOnly === true`, seuls les centres avec `isNightActive === true` sont retournés avec un score de surbrillance néon.

---

## 6. Contrat du Moteur Statistique & KPIs (Analytics Engine)

Le module `kpiService.js` recalcule en continu les indicateurs affichés dans le tableau de bord et les graphiques.

### 6.1 Méthode `kpiService.computeDashboardKPIs(centers: CenterEntity[]): KPIDashboardData`

#### Structure de retour `KPIDashboardData`
```typescript
interface KPIDashboardData {
  totalCenters: {
    value: number;
    label: "Total Structures";
    trend: string;
  };
  totalBeds: {
    value: number;
    label: "Capacité en Lits";
    activeCentersCount: number;
  };
  nightCoverage: {
    ratePercentage: number;     // Ex: 42.5 (%)
    activeNightCenters: number;
    label: "Taux Couverture Nuit";
  };
  capacityByArrondissement: {
    arrondissement: number;     // 1 à 20
    bedCount: number;
    centerCount: number;
  }[];
  categoryDistribution: {
    category: 'CHU' | 'CHRS' | 'SSP' | 'CASVP';
    count: number;
    color: string;             // Code couleur néon hexadécimal
  }[];
}
```

---

## 7. Contrat d'Événements Applicatifs (Event Bus Pub/Sub)

Tous les modules UI et métiers communiquent de manière découplée à travers l'`eventBus.js`. Les événements respectent les spécifications de charge utile (*Payload*) suivantes :

```typescript
// 1. Données chargées avec succès
interface DataLoadedPayload {
  centers: CenterEntity[];
  meta: { source: 'live_api' | 'local_fallback'; timestamp: string };
}

// 2. Filtres modifiés par l'utilisateur
interface FilterChangedPayload {
  criteria: FilterCriteria;
  resultCount: number;
}

// 3. Sélection d'un centre (clic marqueur carte ou liste)
interface CenterSelectedPayload {
  center: CenterEntity;
  origin: 'map_marker' | 'search_item' | 'kpi_card';
}

// 4. Fermeture de la fiche détaillée
interface CenterDeselectedPayload {
  closedCenterId: string;
}

// 5. Bascule du mode Focus Nuit (F5)
interface NightFocusToggledPayload {
  isEnabled: boolean;
}

// 6. Déclenchement de l'Easter Egg (F8)
interface EasterEggTriggeredPayload {
  secretCode: 'clair-de-lune';
  action: 'starfall_and_fullmoon_theme';
}
```

---

## Annexe A — Modèles de Données & DTOs Partagés

### DTO Canonique : `CenterEntity`

```typescript
interface CenterEntity {
  id: string;                          // Identifiant normalisé unique
  name: string;                        // Nom clair et nettoyé
  category: 'CHU' | 'CHRS' | 'SSP' | 'CASVP';
  categoryLabel: string;               // Libellé complet en français
  address: string;                     // Adresse postale normalisée
  postalCode: string;                  // Code postal (75001 à 75020)
  arrondissement: number;              // 1 à 20
  phone: string;                       // Numéro au format lisible ou "Non renseigné"
  capacity: number;                    // Nombre de lits/places (0 pour les centres de jour)
  isNightActive: boolean;              // Vrai si permanence ou accueil nocturne garanti
  nightDescription: string;            // Détails sur le dispositif de nuit
  hoursDescription: string;            // Plage horaire textuelle
  publicTarget: string;                // Public accueilli (Familles, Hommes seuls, Tous)
  coordinates: {
    lat: number;                       // Latitude WGS84
    lng: number;                       // Longitude WGS84
  };
  neonColor: string;                   // Couleur d'accent néon pour le rendu Leaflet
}
```

---

## Annexe B — Codes d'Erreurs & Gestion des Anomalies

| Code d'erreur | HTTP Status | Contexte | Stratégie de remédiation |
| :--- | :--- | :--- | :--- |
| `ERR_API_TIMEOUT` | 408 / Timeout | Appel à `opendata.paris.fr` $> 6000\text{ ms}$ | Bascule silencieuse automatique sur le fallback local et journalisation en console. |
| `ERR_NETWORK_DISCONNECTED` | 0 / Offline | Déconnexion Internet de l'usager | Chargement des assets de secours locaux avec notification de fonctionnement hors-ligne. |
| `ERR_CORS_BLOCKED` | 0 / CORS | Restriction inopinée du navigateur | Bascule immédiate sur les GeoJSON locaux de secours. |
| `ERR_GEOJSON_MALFORMED` | 422 / Format | Réponse API corrompue ou géométrie manquante | Rejet des entités invalides via filtre sanitaire et conservation des points valides. |
| `ERR_EMPTY_FILTER_RESULT` | 200 / Warning | Aucun centre ne correspond aux critères saisis | Affichage de l'état vide informatif (*Empty State*) avec suggestion de réinitialisation. |

---

*Ce document d’API & Data Contract définit avec précision et rigueur les interfaces de données du projet « Visualisez l'OpenData au clair de lune ».*
