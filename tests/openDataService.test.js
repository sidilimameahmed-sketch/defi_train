import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openDataService } from '../src/services/openDataService.js';
import { eventBus } from '../src/core/eventBus.js';
import { EVENTS } from '../src/core/constants.js';

describe('Phase 2 - openDataService (Résilience & Fallback)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    openDataService.cachedData = null;
    openDataService.cacheTimestamp = null;
  });

  it('bascule sur le fallback local en cas d’échec réseau et émet data:fallback_used', async () => {
    const fallbackSpy = vi.fn();
    eventBus.on(EVENTS.DATA_FALLBACK_USED, fallbackSpy);

    const mockGeoJSON = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [2.35, 48.85] },
          properties: { type: 'CHU', nom: 'Centre Fallback', code_postal: 75004 }
        }
      ]
    };

    // Simule échec réseau sur l'API externe, puis succès sur le fallback local
    global.fetch = vi.fn((url) => {
      if (typeof url === 'string' && url.includes('opendata.paris.fr')) {
        return Promise.reject(new Error('Network timeout simulation'));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockGeoJSON)
      });
    });

    const result = await openDataService.fetchAllData({ forceRefresh: true });

    expect(result.success).toBe(true);
    expect(result.meta.source).toBe('local_fallback');
    expect(fallbackSpy).toHaveBeenCalled();
    expect(result.data.centers.length).toBeGreaterThan(0);
  });

  it('calcule correctement les métadonnées globales de centres et lits', async () => {
    const mockHebGeoJSON = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [2.36, 48.83] },
          properties: { type: 'CHU', nom: 'CHU 1', capacite_lits: 50, code_postal: 75013 }
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [2.37, 48.84] },
          properties: { type: 'CHRS', nom: 'CHRS 1', capacite_lits: 30, code_postal: 75013 }
        }
      ]
    };

    const mockSspGeoJSON = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [2.38, 48.86] },
          properties: { nom_de_l_etablissement: 'MdS 11', code_postal: '75011' }
        }
      ]
    };

    global.fetch = vi.fn((url) => {
      const u = String(url);
      if (u.includes('hebergements')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockHebGeoJSON) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSspGeoJSON) });
    });

    const result = await openDataService.fetchAllData({ forceRefresh: true });

    expect(result.success).toBe(true);
    expect(result.data.metadata.totalCenters).toBe(3);
    expect(result.data.metadata.chuCount).toBe(1);
    expect(result.data.metadata.chrsCount).toBe(1);
    expect(result.data.metadata.sspCount).toBe(1);
    expect(result.data.metadata.totalBedCapacity).toBe(80);
  });
});
