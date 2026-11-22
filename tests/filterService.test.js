import { describe, it, expect } from 'vitest';
import { applyFilters, normalizeSearchText } from '../src/services/filterService.js';

describe('Phase 5 - filterService (Search & Night Focus F3/F5)', () => {
  const sampleCenters = [
    {
      id: 'c1',
      name: 'CHU René Coty',
      address: '24 Boulevard René Coty',
      postalCode: '75014',
      arrondissement: 14,
      category: 'CHU',
      isNightActive: true,
      publicTarget: 'Hommes isolés'
    },
    {
      id: 'c2',
      name: 'CHRS Relais des Carrières',
      address: '71 rue du Château des Rentiers',
      postalCode: '75013',
      arrondissement: 13,
      category: 'CHRS',
      isNightActive: false,
      publicTarget: 'Hommes et femmes'
    },
    {
      id: 'c3',
      name: 'Maison des Solidarités 10',
      address: '23 bis Rue Bichat',
      postalCode: '75010',
      arrondissement: 10,
      category: 'SSP',
      isNightActive: false,
      publicTarget: 'Tout public'
    },
    {
      id: 'c4',
      name: 'CHU Crimée',
      address: '166 rue de Crimée',
      postalCode: '75019',
      arrondissement: 19,
      category: 'CHU',
      isNightActive: true,
      publicTarget: 'Familles'
    }
  ];

  describe('normalizeSearchText', () => {
    it('retire les accents et normalise en minuscules', () => {
      expect(normalizeSearchText('Hébergement Éclairé')).toBe('hebergement eclaire');
      expect(normalizeSearchText('  RENÉ COTY  ')).toBe('rene coty');
    });
  });

  describe('applyFilters', () => {
    it('recherche insensible aux accents et à la casse', () => {
      const results = applyFilters(sampleCenters, { searchTerm: 'rene' });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('CHU René Coty');
    });

    it('recherche par rue', () => {
      const results = applyFilters(sampleCenters, { searchTerm: 'Bichat' });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Maison des Solidarités 10');
    });

    it('recherche par arrondissement textuel "14e" ou "19ème"', () => {
      const r1 = applyFilters(sampleCenters, { searchTerm: '14e' });
      expect(r1).toHaveLength(1);
      expect(r1[0].arrondissement).toBe(14);

      const r2 = applyFilters(sampleCenters, { searchTerm: '19ème' });
      expect(r2).toHaveLength(1);
      expect(r2[0].arrondissement).toBe(19);
    });

    it('filtre par catégories multiples (OU logique)', () => {
      const results = applyFilters(sampleCenters, { categories: ['CHU', 'SSP'] });
      expect(results).toHaveLength(3); // 2 CHU + 1 SSP
    });

    it('filtre par arrondissement numérique', () => {
      const results = applyFilters(sampleCenters, { arrondissements: [13] });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('c2');
    });

    it('filtre par Mode Focus Nuit (F5)', () => {
      const results = applyFilters(sampleCenters, { nightFocusOnly: true });
      expect(results).toHaveLength(2); // Seuls les 2 CHU actifs de nuit
      expect(results.every((c) => c.isNightActive)).toBe(true);
    });

    it('combine recherche, typologie et Focus Nuit', () => {
      const results = applyFilters(sampleCenters, {
        searchTerm: 'Crimée',
        categories: ['CHU'],
        nightFocusOnly: true
      });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('c4');
    });

    it('retourne un tableau vide sans correspondances', () => {
      const results = applyFilters(sampleCenters, { searchTerm: 'IntrouvableXYZ' });
      expect(results).toHaveLength(0);
    });
  });
});
