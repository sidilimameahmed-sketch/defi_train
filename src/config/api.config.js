/**
 * Configuration des APIs et endpoints OpenData Paris
 * Projet: Visualisez l'OpenData au clair de lune (Défi Apside)
 */

export const API_CONFIG = Object.freeze({
  BASE_URL: 'https://opendata.paris.fr/api/explore/v2.1',
  TIMEOUT_MS: 6000,
  ENDPOINTS: {
    SSP_CASVP: {
      DATASET_ID: 'coordonnees-ssp-et-casvp',
      URL: 'https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/coordonnees-ssp-et-casvp/exports/geojson',
      FALLBACK: './data/coordonnees-ssp-et-casvp.fallback.geojson'
    },
    HEBERGEMENTS: {
      DATASET_ID: 'hebergements-casvp',
      URL: 'https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/hebergements-casvp/exports/geojson',
      FALLBACK: './data/hebergements-casvp.fallback.geojson'
    }
  },
  DEFAULT_PARAMS: {
    lang: 'fr',
    timezone: 'Europe/Paris'
  }
});
