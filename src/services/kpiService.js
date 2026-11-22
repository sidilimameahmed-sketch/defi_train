/**
 * Moteur d'Agrégation Statistique et Calcul des KPIs (Analytics Engine)
 * Projet: Visualisez l'OpenData au clair de lune
 * Conforme au contrat kpiService.js de api-contract.md (Section 6)
 */

import { CATEGORIES, ARRONDISSEMENTS } from '../core/constants.js';

/**
 * Calcule l'ensemble des indicateurs clés pour le tableau de bord
 * @param {Array<Object>} centers Liste de CenterEntity
 * @returns {Object} KPIDashboardData
 */
export function computeDashboardKPIs(centers = []) {
  const safeCenters = Array.isArray(centers) ? centers : [];
  const totalCount = safeCenters.length;

  let totalBeds = 0;
  let bedProvidingCenters = 0;
  let activeNightCenters = 0;

  // Initialisation des compteurs par catégorie
  const categoryCounts = {
    CHU: 0,
    CHRS: 0,
    SSP: 0,
    CASVP: 0
  };

  // Initialisation des compteurs par arrondissement (1 à 20)
  const arrondissementMap = new Map();
  for (const arr of ARRONDISSEMENTS) {
    arrondissementMap.set(arr, { arrondissement: arr, bedCount: 0, centerCount: 0 });
  }

  for (const center of safeCenters) {
    // Calcul des lits
    const capacity = parseInt(center.capacity, 10) || 0;
    if (capacity > 0) {
      totalBeds += capacity;
      bedProvidingCenters++;
    }

    // Structures actives de nuit
    if (center.isNightActive) {
      activeNightCenters++;
    }

    // Répartition par typologie
    const cat = center.category || 'CHU';
    if (categoryCounts[cat] !== undefined) {
      categoryCounts[cat]++;
    }

    // Répartition par arrondissement
    const arr = parseInt(center.arrondissement, 10);
    if (arrondissementMap.has(arr)) {
      const entry = arrondissementMap.get(arr);
      entry.bedCount += capacity;
      entry.centerCount += 1;
    }
  }

  // Taux de couverture nocturne (% de structures ouvertes la nuit)
  const ratePercentage = totalCount > 0
    ? parseFloat(((activeNightCenters / totalCount) * 100).toFixed(1))
    : 0;

  // Tendance textuelle dynamique
  const trend = totalCount > 0
    ? `${activeNightCenters} permanences actives de nuit`
    : 'Aucune donnée';

  // Formatage de la distribution par catégorie
  const categoryDistribution = Object.keys(categoryCounts).map((catKey) => ({
    category: catKey,
    count: categoryCounts[catKey],
    color: CATEGORIES[catKey]?.color || '#FFFFFF',
    label: CATEGORIES[catKey]?.shortLabel || catKey
  }));

  // Formatage de la capacité par arrondissement
  const capacityByArrondissement = Array.from(arrondissementMap.values());

  return {
    totalCenters: {
      value: totalCount,
      label: "Total Structures",
      trend
    },
    totalBeds: {
      value: totalBeds,
      label: "Capacité en Lits",
      activeCentersCount: bedProvidingCenters
    },
    nightCoverage: {
      ratePercentage,
      activeNightCenters,
      label: "Taux Couverture Nuit"
    },
    capacityByArrondissement,
    categoryDistribution
  };
}
