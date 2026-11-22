/**
 * Client Réseau Résilient & Orchestration OpenData Paris
 * Projet: Visualisez l'OpenData au clair de lune
 * Conforme au contrat openDataService.js de api-contract.md
 */

import { API_CONFIG } from '../config/api.config.js';
import { eventBus } from '../core/eventBus.js';
import { EVENTS } from '../core/constants.js';
import { normalizeGeoJSON } from './dataNormalizer.js';

class OpenDataService {
  constructor() {
    this.cachedData = null;
    this.cacheTimestamp = null;
    this.CACHE_TTL_MS = 60 * 1000; // 1 minute
  }

  /**
   * Récupère un jeu de données avec fallback automatique en cas d'erreur
   * @param {Object} endpointConfig
   * @param {'hebergements' | 'ssp_casvp'} datasetType
   * @param {number} timeoutMs
   * @returns {Promise<{ features: Array, source: 'live_api' | 'local_fallback' }>}
   */
  async fetchDataset(endpointConfig, datasetType, timeoutMs = API_CONFIG.TIMEOUT_MS) {
    let usedSource = 'live_api';

    // 1. Tentative d'appel à l'API en direct
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(endpointConfig.URL, {
        headers: { 'Accept': 'application/geo+json, application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status} sur ${endpointConfig.DATASET_ID}`);
      }

      const geojson = await response.json();
      if (!geojson || geojson.type !== 'FeatureCollection') {
        throw new Error(`Réponse non-GeoJSON reçue pour ${endpointConfig.DATASET_ID}`);
      }

      return {
        centers: normalizeGeoJSON(geojson, datasetType),
        source: 'live_api'
      };
    } catch (networkErr) {
      console.warn(`[OpenDataService] Bascule sur le fallback local pour "${endpointConfig.DATASET_ID}":`, networkErr.message);
      usedSource = 'local_fallback';
    }

    // 2. Bascule transparente sur le fichier de secours local
    try {
      const fallbackResponse = await fetch(endpointConfig.FALLBACK);
      if (!fallbackResponse.ok) {
        throw new Error(`Impossible de lire le fallback local ${endpointConfig.FALLBACK}`);
      }

      const fallbackGeojson = await fallbackResponse.json();
      eventBus.emit(EVENTS.DATA_FALLBACK_USED, {
        dataset: endpointConfig.DATASET_ID,
        fallbackPath: endpointConfig.FALLBACK
      });

      return {
        centers: normalizeGeoJSON(fallbackGeojson, datasetType),
        source: 'local_fallback'
      };
    } catch (fallbackErr) {
      console.error(`[OpenDataService] Échec critique du fallback local pour "${endpointConfig.DATASET_ID}":`, fallbackErr);
      return {
        centers: [],
        source: 'local_fallback'
      };
    }
  }

  /**
   * Récupère l'ensemble des données unifiées (Hébergements + SSP/CASVP)
   * @param {Object} [options]
   * @param {boolean} [options.forceRefresh=false]
   * @param {number} [options.timeoutMs]
   * @returns {Promise<{ success: boolean, data: Object, error: Object|null, meta: Object }>}
   */
  async fetchAllData(options = {}) {
    const { forceRefresh = false, timeoutMs = API_CONFIG.TIMEOUT_MS } = options;

    // Utilisation du cache si valide
    const now = Date.now();
    if (!forceRefresh && this.cachedData && this.cacheTimestamp && (now - this.cacheTimestamp < this.CACHE_TTL_MS)) {
      return {
        success: true,
        data: this.cachedData,
        error: null,
        meta: {
          source: 'cache',
          timestamp: new Date(this.cacheTimestamp).toISOString(),
          totalCount: this.cachedData.centers.length
        }
      };
    }

    eventBus.emit(EVENTS.DATA_LOADING, {});

    try {
      const [hebResult, sspResult] = await Promise.all([
        this.fetchDataset(API_CONFIG.ENDPOINTS.HEBERGEMENTS, 'hebergements', timeoutMs),
        this.fetchDataset(API_CONFIG.ENDPOINTS.SSP_CASVP, 'ssp_casvp', timeoutMs)
      ]);

      const allCenters = [...hebResult.centers, ...sspResult.centers];
      const source = (hebResult.source === 'local_fallback' || sspResult.source === 'local_fallback')
        ? 'local_fallback'
        : 'live_api';

      // Calcul des métadonnées
      let chuCount = 0;
      let chrsCount = 0;
      let sspCount = 0;
      let casvpCount = 0;
      let totalBedCapacity = 0;

      for (const center of allCenters) {
        if (center.category === 'CHU') chuCount++;
        else if (center.category === 'CHRS') chrsCount++;
        else if (center.category === 'SSP') sspCount++;
        else if (center.category === 'CASVP') casvpCount++;

        totalBedCapacity += (center.capacity || 0);
      }

      const unifiedDataset = {
        centers: allCenters,
        metadata: {
          fetchedAt: new Date().toISOString(),
          source,
          sspCount,
          casvpCount,
          chuCount,
          chrsCount,
          totalCenters: allCenters.length,
          totalBedCapacity
        }
      };

      this.cachedData = unifiedDataset;
      this.cacheTimestamp = now;

      const envelope = {
        success: true,
        data: unifiedDataset,
        error: null,
        meta: {
          source,
          timestamp: unifiedDataset.metadata.fetchedAt,
          totalCount: allCenters.length
        }
      };

      eventBus.emit(EVENTS.DATA_LOADED, envelope);
      return envelope;
    } catch (err) {
      const errorObj = {
        code: 'ERR_OPEN_DATA_FETCH',
        message: err.message || "Erreur lors de la récupération des données",
        details: err
      };

      eventBus.emit(EVENTS.DATA_ERROR, errorObj);

      return {
        success: false,
        data: null,
        error: errorObj,
        meta: {
          source: 'error',
          timestamp: new Date().toISOString(),
          totalCount: 0
        }
      };
    }
  }
}

export const openDataService = new OpenDataService();
