# Visualisez l'OpenData au clair de lune — AI Workflow & Execution Guide

**Projet :** Visualisez l'OpenData au clair de lune  
**Partenaire :** Apside — **Thématique :** Futur des données ouvertes — **Sous-thème :** La Nuit  
**Version :** 1.0.0 (Manuel d'exploitation et de gouvernance des agents IA)  
**Document de référence coordonnant :** L'ensemble des spécifications dans `new files/`  

---

## 1. Objectif & Cadre de Travail des Agents IA

Ce document formalise les règles opérationnelles, la répartition des rôles et les protocoles de vérification régissant l'intervention des agents d'intelligence artificielle (AI Agents) dans l'implémentation, la validation et la livraison du projet **« Visualisez l'OpenData au clair de lune »**.

Le workflow garantit une exécution rigoureuse, incrémentale et étanche, empêchant toute dérive de périmètre (*Scope Creep*), toute hallucination de données et toute contamination par d'anciens projets.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR AGENT (Supervision)                   │
│  - Analyse master-plan.md, sélectionne la phase en cours                │
│  - Définit le périmètre exact et les fichiers autorisés                 │
│  - Protège l'intégrité architecturale et la hiérarchie des vérités      │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌──────────────────────────────────────┐    ┌──────────────────────────────────────┐
│       DATA / BACKEND AGENT           │    │          FRONTEND AGENT              │
│  - Ingestion OpenData & Fallback     │    │  - Carte Leaflet & Marqueurs néon    │
│  - Normalisation GeoJSON & Sanitize  │    │  - Dashboard KPI & Compteur animé    │
│  - Moteur KPI & Filtre Focus Nuit    │    │  - Bottom Sheet, Charts & Easter Egg │
└──────────────────┬───────────────────┘    └──────────────────┬───────────────────┘
                   │                                           │
                   └─────────────────────┬─────────────────────┘
                                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    VERIFICATION AGENT (Audit Indépendant)               │
│  - Audit strict vis-à-vis de cahier_charge.md & api-contract.md          │
│  - Détection anti-hallucination & anti-régression                       │
│  - Émission du rapport d'audit : PASS / PASS WITH NOTES / FAIL          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼ (Si PASS)
┌─────────────────────────────────────────────────────────────────────────┐
│                    DEVOPS & RELEASE AGENT (Déploiement)                 │
│  - Exécution du build de production Vite & Tests Vitest                 │
│  - Déploiement automatisé sur GitHub Pages / Netlify                     │
│  - Vérification de la disponibilité HTTPS en ligne                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Hiérarchie des Sources de Vérité (Source of Truth)

En cas de divergence ou d'ambiguïté au cours de l'implémentation, les agents IA appliquent l'ordre de préséance impératif suivant :

1. **`cahier_charge.md` (Niveau 1 — Suprême pour le Métier et l'Organisation) :**  
   Définit ce que l'on construit (les 8 fonctionnalités F1 à F8, le thème nocturne Apside, l'absence d'authentification requise, les livrables attendus).
2. **Sources OpenData de la Ville de Paris (Niveau 2 — Suprême pour la Donnée Réelle) :**  
   Les endpoints officiels GeoJSON `coordonnees-ssp-et-casvp` et `hebergements-casvp` constituent la seule source légitime de données. Aucun établissement ou attribut fictif ne peut être inventé.
3. **Spécifications dans `new files/` (Niveau 3 — Décisions Techniques Validées) :**  
   `architecture.md`, `api-contract.md`, `backend-plan.md`, `frontend-plan.md`, `infra-plan.md` et `master-plan.md`.
4. **Fichiers de `Principale files/` (Niveau 4 — Référence Méthodologique Uniquement) :**  
   Servent uniquement à comprendre la méthode de structuration. **Interdiction formelle d'y puiser du contenu métier** (ShopManager).

---

## 3. Rôles & Responsabilités des Agents

| Rôle de l'Agent | Responsabilités Principales | Fichiers Autorisés en Écriture |
| :--- | :--- | :--- |
| **Orchestrator Agent** | Lit le `master-plan.md`, assigne les tâches de la phase active, fixe les frontières d'intervention et coordonne les points de contrôle. | Fichiers de suivi et logs d'orchestration. |
| **Data / Backend Agent** | Développe les scripts d'ingestion des GeoJSON, la normalisation des données, le client réseau résilient et les moteurs de calcul des KPIs. | `scripts/**`, `src/services/**`, `src/config/**`, `public/data/**`. |
| **Frontend Agent** | Développe l'interface utilisateur, la carte Leaflet sombre, les marqueurs néon, le Bottom Sheet, Chart.js et l'Easter Egg. | `src/components/**`, `src/map/**`, `src/assets/css/**`, `index.html`. |
| **Verification Agent** | Exécute un audit indépendant et impartial en lecture seule après chaque phase. Rédige le rapport de conformité. | Aucun fichier de code (produit uniquement le rapport de vérification). |
| **DevOps Agent** | Configure les workflows CI/CD, valide le build de production et assure le déploiement sur GitHub Pages ou Netlify. | `.github/**`, `vite.config.js`, `README.md`. |

---

## 4. Protocole Anti-Hallucination & Anti-Pollution

Pour éviter toute dérive, chaque agent IA doit appliquer les 6 règles d'or suivantes :

1. **Interdiction d'inventer des fonctionnalités :** Ne jamais introduire de modules non mentionnés dans le cahier des charges (ex. gestion de comptes, paniers, bases MongoDB, paiements, formulaires d'avis).
2. **Interdiction d'inventer des données :** Tout centre affiché sur la carte ou comptabilisé dans les KPIs provient obligatoirement des flux GeoJSON d'OpenData Paris ou des fallbacks de secours.
3. **Déclaration explicite des hypothèses :** Si un détail mineur n'est pas précisé dans la donnée source (ex. absence d'horaire explicite sur un centre), l'agent applique une valeur de repli conventionnelle et la consigne comme **Assumption** documentée.
4. **Validation de l'absence de régression :** Toute modification de code doit valider la suite de tests unitaires existante (`npm test`) avant d'être soumise à l'audit.
5. **Sanitisation systématique :** Tout champ textuel externe injecté dans l'interface doit être préalablement passé au filtre de nettoyage anti-XSS.
6. **Arrêt immédiat en cas de doute :** Si une instruction nécessite une modification architecturale majeure non couverte par les spécifications, l'agent s'interrompt et formule une **Open Question** à l'attention du superviseur humain.

---

## 5. Déroulement Type d'une Tâche par Agent (Cycle d'Exécution)

```
[ 1. Préparation & Chargement du Contexte ]
  ├── Lecture de cahier_charge.md & master-plan.md
  └── Identification des contrats pertinents dans api-contract.md
           │
           ▼
[ 2. Déclaration du Périmètre (Scope) ]
  ├── Annonce explicite de la phase et de la tâche traitée
  └── Liste fermée des fichiers cibles qui seront créés ou modifiés
           │
           ▼
[ 3. Implémentation du Code ]
  ├── Respect strict des conventions (CSS BEM/Variables, ES Modules, SoC)
  └── Implémentation des tests unitaires correspondants
           │
           ▼
[ 4. Validation Locale ]
  ├── Exécution de npm run lint
  └── Exécution de npm test
           │
           ▼
[ 5. Passage au Verification Agent ]
  ├── Audit contre cahier_charge.md et architecture.md
  └── Émission du rapport d'audit (PASS / FAIL)
           │
           ├── Si FAIL : Correction immédiate par l'agent de build
           └── Si PASS : Transition vers la phase suivante du Master Plan
```

---

## 6. Portes de Validation (Quality & Verification Gates)

Le passage d'une phase à la suivante dans le Master Plan exige la validation cumulative de ces 5 critères :

- [x] **Porte 1 (Contrat) :** Les structures de données manipulées correspondent exactement aux interfaces définies dans `api-contract.md`.
- [x] **Porte 2 (Fonctionnalité) :** La fonctionnalité développée répond précisément aux exigences F1-F8 décrites dans `cahier_charge.md`.
- [x] **Porte 3 (Performance & Design) :** Le rendu visuel respecte le Dark Mode nocturne, les contrastes néon et maintient un affichage à 60 FPS sans fuite mémoire.
- [x] **Porte 4 (Résilience) :** La déconnexion réseau simulée n'entraîne aucun blocage de l'interface (bascule fallback active).
- [x] **Porte 5 (Audit) :** Le rapport du Verification Agent conclut à un avis **PASS** ou **PASS WITH NOTES**.

---

*Ce document d'AI Workflow garantit une exécution sans faille, sécurisée et totalement fidèle aux ambitions du projet « Visualisez l'OpenData au clair de lune ».*
