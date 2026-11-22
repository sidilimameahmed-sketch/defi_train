import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  extractArrondissement,
  formatPhoneNumber,
  normalizeHebergementFeature,
  normalizeSspCasvpFeature,
  normalizeGeoJSON
} from '../src/services/dataNormalizer.js';

describe('Phase 2 - dataNormalizer & Anti-XSS Sanitizer', () => {
  describe('sanitizeString', () => {
    it('élimine les balises HTML et les scripts malveillants', () => {
      const malicious = '<script>alert("xss")</script>Centre de test';
      expect(sanitizeString(malicious)).toBe('alert("xss")Centre de test');
    });

    it('élimine les pseudos protocoles javascript:', () => {
      const dangerous = 'javascript:doBadThings()';
      expect(sanitizeString(dangerous)).toBe('doBadThings()');
    });

    it('gère les valeurs nulles ou indéfinies sans planter', () => {
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
    });
  });

  describe('extractArrondissement', () => {
    it('extrait correctement les arrondissements parisiens 75001 à 75020', () => {
      expect(extractArrondissement('75011')).toBe(11);
      expect(extractArrondissement(75014)).toBe(14);
      expect(extractArrondissement('75002')).toBe(2);
      expect(extractArrondissement('75020')).toBe(20);
    });

    it('détecte les arrondissements dans les libellés textuels', () => {
      expect(extractArrondissement('', 'MdS 13 - Maison des Solidarités')).toBe(13);
      expect(extractArrondissement('', 'Centre social 19ème')).toBe(19);
    });

    it('retourne 0 pour les codes hors Paris intra-muros', () => {
      expect(extractArrondissement('94320')).toBe(0);
      expect(extractArrondissement('93100')).toBe(0);
    });
  });

  describe('formatPhoneNumber', () => {
    it('formate les numéros à 10 chiffres avec espaces', () => {
      expect(formatPhoneNumber('0153192626')).toBe('01 53 19 26 26');
      expect(formatPhoneNumber('01.45.81.90.00')).toBe('01 45 81 90 00');
    });

    it('retourne "Non renseigné" si le numéro est vide', () => {
      expect(formatPhoneNumber('')).toBe('Non renseigné');
      expect(formatPhoneNumber(null)).toBe('Non renseigné');
    });
  });

  describe('normalizeHebergementFeature', () => {
    it('normalise un CHU avec statut nocturne actif et lueur néon verte', () => {
      const rawFeature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [2.36892, 48.83541]
        },
        properties: {
          type: 'CHU',
          nom: 'CHU René Coty',
          adresse: '24 Boulevard René Coty',
          code_postal: 75014,
          capacite_lits: 75,
          telephone: '01 43 27 12 34'
        }
      };

      const entity = normalizeHebergementFeature(rawFeature, 0);

      expect(entity).not.toBeNull();
      expect(entity.id).toBe('heb_14_1');
      expect(entity.name).toBe('CHU René Coty');
      expect(entity.category).toBe('CHU');
      expect(entity.arrondissement).toBe(14);
      expect(entity.capacity).toBe(75);
      expect(entity.isNightActive).toBe(true);
      expect(entity.neonColor).toBe('#39FF14');
      expect(entity.coordinates).toEqual({ lat: 48.83541, lng: 2.36892 });
    });

    it('rejette les features sans coordonnées géométriques valides', () => {
      const invalid = { type: 'Feature', geometry: null, properties: {} };
      expect(normalizeHebergementFeature(invalid, 0)).toBeNull();
    });
  });

  describe('normalizeSspCasvpFeature', () => {
    it('normalise un Service Social de Proximité diurne avec capacité 0', () => {
      const rawFeature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [2.368277, 48.870995]
        },
        properties: {
          nom_de_l_etablissement: 'MdS 10',
          ndeg_rue: '23 bis Rue Bichat',
          code_postal: '75010',
          telephone: '01 53 19 26 26',
          horaires: '8h30 - 17 h'
        }
      };

      const entity = normalizeSspCasvpFeature(rawFeature, 0);

      expect(entity).not.toBeNull();
      expect(entity.id).toBe('ssp_10_1');
      expect(entity.category).toBe('SSP');
      expect(entity.arrondissement).toBe(10);
      expect(entity.capacity).toBe(0);
      expect(entity.isNightActive).toBe(false);
      expect(entity.neonColor).toBe('#00F0FF');
      expect(entity.coordinates).toEqual({ lat: 48.870995, lng: 2.368277 });
    });
  });

  describe('normalizeGeoJSON', () => {
    it('retourne un tableau vide pour un objet GeoJSON invalide', () => {
      expect(normalizeGeoJSON(null)).toEqual([]);
      expect(normalizeGeoJSON({})).toEqual([]);
      expect(normalizeGeoJSON({ type: 'Point' })).toEqual([]);
    });
  });
});
