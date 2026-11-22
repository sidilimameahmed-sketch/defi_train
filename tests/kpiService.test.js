import { describe, it, expect } from 'vitest';
import { computeDashboardKPIs } from '../src/services/kpiService.js';

describe('Phase 4 - kpiService (Analytics Engine)', () => {
  const sampleCenters = [
    {
      id: 'heb-1',
      name: 'CHU René Coty',
      category: 'CHU',
      arrondissement: 14,
      capacity: 75,
      isNightActive: true
    },
    {
      id: 'heb-2',
      name: 'CHRS Relais des Carrières',
      category: 'CHRS',
      arrondissement: 13,
      capacity: 45,
      isNightActive: false
    },
    {
      id: 'ssp-1',
      name: 'MdS 13',
      category: 'SSP',
      arrondissement: 13,
      capacity: 0,
      isNightActive: false
    },
    {
      id: 'casvp-1',
      name: 'CASVP 14',
      category: 'CASVP',
      arrondissement: 14,
      capacity: 0,
      isNightActive: false
    }
  ];

  it('calcule correctement les indicateurs globaux sur un jeu de données', () => {
    const kpis = computeDashboardKPIs(sampleCenters);

    // Total structures
    expect(kpis.totalCenters.value).toBe(4);
    expect(kpis.totalCenters.trend).toContain('1 permanences actives de nuit');

    // Total lits
    expect(kpis.totalBeds.value).toBe(120); // 75 + 45
    expect(kpis.totalBeds.activeCentersCount).toBe(2);

    // Taux couverture nuit (1 structure sur 4 = 25.0%)
    expect(kpis.nightCoverage.ratePercentage).toBe(25.0);
    expect(kpis.nightCoverage.activeNightCenters).toBe(1);
  });

  it('fournit une distribution par catégorie complète et colorée', () => {
    const kpis = computeDashboardKPIs(sampleCenters);
    const dist = kpis.categoryDistribution;

    expect(dist).toHaveLength(4);
    const chu = dist.find((d) => d.category === 'CHU');
    const chrs = dist.find((d) => d.category === 'CHRS');
    const ssp = dist.find((d) => d.category === 'SSP');
    const casvp = dist.find((d) => d.category === 'CASVP');

    expect(chu.count).toBe(1);
    expect(chrs.count).toBe(1);
    expect(ssp.count).toBe(1);
    expect(casvp.count).toBe(1);
    expect(chu.color).toBe('#39FF14');
  });

  it('agrège la capacité par arrondissement (1 à 20)', () => {
    const kpis = computeDashboardKPIs(sampleCenters);
    const arrMap = kpis.capacityByArrondissement;

    expect(arrMap).toHaveLength(20);
    const arr14 = arrMap.find((a) => a.arrondissement === 14);
    const arr13 = arrMap.find((a) => a.arrondissement === 13);
    const arr1 = arrMap.find((a) => a.arrondissement === 1);

    expect(arr14.bedCount).toBe(75);
    expect(arr14.centerCount).toBe(2);

    expect(arr13.bedCount).toBe(45);
    expect(arr13.centerCount).toBe(2);

    expect(arr1.bedCount).toBe(0);
    expect(arr1.centerCount).toBe(0);
  });

  it('gère une liste vide sans division par zéro', () => {
    const kpis = computeDashboardKPIs([]);

    expect(kpis.totalCenters.value).toBe(0);
    expect(kpis.totalBeds.value).toBe(0);
    expect(kpis.nightCoverage.ratePercentage).toBe(0);
    expect(kpis.capacityByArrondissement).toHaveLength(20);
  });
});
