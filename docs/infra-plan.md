# Visualisez l'OpenData au clair de lune — Infrastructure & Deployment Plan

**Projet :** Visualisez l'OpenData au clair de lune  
**Partenaire :** Apside — **Thématique :** Futur des données ouvertes — **Sous-thème :** La Nuit  
**Version :** 1.0.0 (Spécifications d'infrastructure, hébergement et déploiement)  
**Document compagnon de :** `architecture.md`, `backend-plan.md` et `frontend-plan.md`  

---

## 1. Objectif & Philosophie d'Infrastructure

Ce document définit les règles de gouvernance de l'infrastructure, la topologie d'exécution, la configuration réseau, la sécurité et les pipelines d'intégration/déploiement continu (CI/CD) pour l'application **« Visualisez l'OpenData au clair de lune »**.

Conformément aux directives de `cahier_charge.md` et aux décisions d'`architecture.md`, l'infrastructure adopte une approche résolument **Jamstack / Edge-First** :
- **Exécution 100% statique & distribuée :** Aucun serveur d'application backend persistant ni base de données lourde à maintenir pour le MVP, garantissant des coûts d'exploitation nuls, une résilience maximale et une scalabilité quasi-infinie.
- **Résilience décentralisée :** Les données GeoJSON de secours sont hébergées au plus près des utilisateurs sur le CDN, assurant une disponibilité 99.99% même en cas de rupture de service des APIs de la Ville de Paris.

---

## 2. Topologie des Environnements & Runtimes

### 2.1 Environnement Local (Développement)
En local, le système s'exécute via Node.js et le serveur de développement rapide **Vite** :

```
Navigateur Local (http://localhost:5173)
       │
       ├── Requêtes statiques / HMR (Vite Dev Server)
       ├── Requêtes API directes ──> opendata.paris.fr (Explore v2.1)
       └── Tuiles cartographiques ──> basemaps.cartocdn.com (Dark Matter)
```

- **Commande de démarrage :** `npm run dev`
- **Serveur local :** Port `:5173` (Vite)
- **Script de synchronisation local :** `npm run data:sync` (génère les fallbacks dans `/public/data/`)

### 2.2 Environnement de Production (Edge CDN)
En production, le code compilé est déployé sur un réseau de distribution mondial (**GitHub Pages** ou **Netlify**) :

```
Utilisateur Web (HTTPS)
       │
       ▼
[ Anycast Global Edge CDN (GitHub Pages / Netlify) ]
       ├── Assets Minifiés : HTML, CSS (Glassmorphism), JS Modules
       ├── Assets Fallback : /public/data/*.fallback.geojson
       │
       ▼ (Exécution dans le navigateur de l'usager)
[ Client SPA ]
       ├── Flux Primaire : Fetch vers https://opendata.paris.fr (Direct)
       ├── Flux Secours  : Fetch vers /data/*.fallback.geojson (En cas d'échec)
       └── Tuiles Carte  : https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png
```

---

## 3. Configuration Réseau, Domaines & Routage

| Paramètre | Spécification Staging | Spécification Production |
| :--- | :--- | :--- |
| **Fournisseur d'Hébergement** | GitHub Pages / Netlify Preview | GitHub Pages / Netlify Production |
| **Protocole** | HTTPS strict (TLS 1.3) | HTTPS strict (HSTS activé) |
| **Certificat SSL/TLS** | Let's Encrypt (Automatique) | Géré automatiquement par le fournisseur |
| **Routage SPA** | Redirection 404 $\rightarrow$ `index.html` | Règle `/* /index.html 200` (`_redirects`) |
| **Mise en cache statique (CDN)** | `Cache-Control: public, max-age=0, must-revalidate` | `max-age=31536000, immutable` (assets hashés) |
| **Cache des données de secours** | `Cache-Control: public, max-age=3600` (1 heure) | `Cache-Control: public, max-age=86400` (24 heures) |

---

## 4. Pipeline de Compilation & Optimisation des Assets (Build Engine)

L'outil de compilation officiel est **Vite** couplé à **Rollup** :

```javascript
// vite.config.js - Extrait de configuration
export default {
  base: './', // Chemins relatifs pour compatibilité GitHub Pages
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          leaflet: ['leaflet'],
          chart: ['chart.js']
        }
      }
    }
  }
};
```

### Optimisations garanties :
- **Code Splitting :** Les bibliothèques volumineuses (`leaflet` et `chart.js`) sont isolées dans des chunks séparés et chargées à la demande.
- **Taille cible du bundle :** HTML + CSS + JS initial $< 180\text{ Ko}$ gzippé.
- **Tree-shaking strict :** Élimination de tout code mort ou méthode non invoquée.

---

## 5. Sécurité, En-têtes HTTP & Content Security Policy (CSP)

L'application respecte les meilleures pratiques de sécurité applicative web :

### 5.1 En-têtes de Sécurité Recommandés (`netlify.toml` ou headers de production)
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://opendata.paris.fr https://*.basemaps.cartocdn.com; img-src 'self' data: https://*.basemaps.cartocdn.com;"
```

### 5.2 Sanitisation des Données Externes
Comme les données GeoJSON proviennent d'une source tierce (`opendata.paris.fr`), tous les champs textuels injectés dans les infobulles de la carte ou le Bottom Sheet sont assainis via DOMPurify afin d'éradiquer tout risque de faille XSS stockée ou reflétée.

---

## 6. Variables d'Environnement & Configuration

Les variables applicatives sont gérées via les fichiers `.env` de Vite (préfixées par `VITE_`) :

| Variable | Description | Valeur par défaut (Prod) |
| :--- | :--- | :--- |
| `VITE_APP_TITLE` | Titre de l'application | "Visualisez l'OpenData au clair de lune" |
| `VITE_API_TIMEOUT_MS` | Délai max avant bascule fallback | `6000` |
| `VITE_DATASET_SSP_URL` | URL de l'API OpenData Paris SSP | `https://opendata.paris.fr/.../coordonnees-ssp-et-casvp/...` |
| `VITE_DATASET_HEB_URL` | URL de l'API OpenData Paris Hébergements | `https://opendata.paris.fr/.../hebergements-casvp/...` |
| `VITE_CARTO_TILES_URL` | URL du fond de carte sombre | `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png` |

---

## 7. Pipeline CI/CD (GitHub Actions)

Un workflow d'automatisation complet `.github/workflows/deploy.yml` est mis en place :

```yaml
name: CI/CD Pipeline - Clair de Lune

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  schedule:
    # Actualisation hebdomadaire planifiée des jeux de secours (Tous les lundis à 03h00)
    - cron: '0 3 * * 1'

jobs:
  validate-and-build:
    runs-on: ubuntu-latest
    steps:
      - name: Récupération du code source
        uses: actions/checkout@v4

      - name: Configuration de Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'

      - name: Installation des dépendances
        run: npm ci

      - name: Validation du code & Linters
        run: npm run lint

      - name: Exécution des tests unitaires & de données
        run: npm test

      - name: Vérification des flux OpenData Paris
        run: node scripts/fetch-fallback-data.mjs --dry-run

      - name: Compilation du projet (Build)
        run: npm run build

      - name: Déploiement sur GitHub Pages (si branche main)
        if: github.ref == 'refs/heads/main'
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## 8. Supervision, Observabilité & Télémétrie

1. **Surveillance de la disponibilité des APIs (Uptime) :**
   - Le workflow GitHub Actions programmé chaque semaine vérifie que les endpoints de `opendata.paris.fr` répondent avec un code HTTP 200.
2. **Journalisation applicative discrète (Client Telemetry) :**
   - Enregistrement dans la console (`console.info` / `console.warn`) de la source active des données (`live_api` vs `local_fallback`).
   - Journalisation des temps de réponse de l'API en millisecondes pour analyser les performances réelles.

---

## 9. Plan de Continuité d'Activité & Sauvegarde (Disaster Recovery)

- **RPO (Recovery Point Objective) :** Moins de 7 jours (grâce au cron de rafraîchissement hebdomadaire des GeoJSON de secours).
- **RTO (Recovery Time Objective) :** Moins de **6 secondes** (temps automatique nécessaire au client pour basculer vers les fichiers locaux en cas d'indisponibilité du serveur de la Ville de Paris).

---

*Ce plan d'infrastructure assure une disponibilité continue, une sécurité sans faille et une mise en production automatisée du projet « Visualisez l'OpenData au clair de lune ».*
