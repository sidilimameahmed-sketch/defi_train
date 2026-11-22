/**
 * Moteur de Recherche Plein Texte et Filtrage Multicritères (Filter Engine)
 * Projet: Visualisez l'OpenData au clair de lune
 * Conforme au contrat filterService.js de api-contract.md (Section 5)
 */

/**
 * Normalise une chaîne pour comparaison insensible à la casse et aux accents
 * @param {string} text
 * @returns {string}
 */
export function normalizeSearchText(text) {
  if (!text) return '';
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Filtre un jeu de données selon des critères multicritères
 * @param {Array<Object>} dataset Liste de CenterEntity
 * @param {Object} criteria FilterCriteria
 * @param {string} [criteria.searchTerm='']
 * @param {Array<string>} [criteria.categories=[]]
 * @param {Array<number>} [criteria.arrondissements=[]]
 * @param {boolean} [criteria.nightFocusOnly=false]
 * @returns {Array<Object>} Centers filtrés
 */
export function applyFilters(dataset = [], criteria = {}) {
  if (!Array.isArray(dataset) || dataset.length === 0) {
    return [];
  }

  const {
    searchTerm = '',
    categories = [],
    arrondissements = [],
    nightFocusOnly = false
  } = criteria;

  const normalizedSearch = normalizeSearchText(searchTerm);
  const hasSearch = normalizedSearch.length > 0;
  const hasCategories = Array.isArray(categories) && categories.length > 0;
  const hasArrondissements = Array.isArray(arrondissements) && arrondissements.length > 0;

  // Détection d'arrondissement dans la recherche textuelle (ex: "14", "14e", "14ème")
  let searchArrondissement = null;
  if (hasSearch) {
    const arrMatch = normalizedSearch.match(/\b(1[0-9]|20|[1-9])(?:\s*(?:e|eme|er|arrondissement))?\b/);
    if (arrMatch) {
      searchArrondissement = parseInt(arrMatch[1], 10);
    }
  }

  return dataset.filter((center) => {
    // 1. Filtre Focus Nuit
    if (nightFocusOnly && !center.isNightActive) {
      return false;
    }

    // 2. Filtre Catégories (OU logique)
    if (hasCategories && !categories.includes(center.category)) {
      return false;
    }

    // 3. Filtre Arrondissements
    if (hasArrondissements && !arrondissements.includes(center.arrondissement)) {
      return false;
    }

    // 4. Recherche Plein Texte
    if (hasSearch) {
      const nameMatch = normalizeSearchText(center.name).includes(normalizedSearch);
      const addressMatch = normalizeSearchText(center.address).includes(normalizedSearch);
      const postalMatch = normalizeSearchText(center.postalCode).includes(normalizedSearch);
      const targetMatch = normalizeSearchText(center.publicTarget).includes(normalizedSearch);
      const arrExactMatch = searchArrondissement !== null && center.arrondissement === searchArrondissement;

      if (!nameMatch && !addressMatch && !postalMatch && !targetMatch && !arrExactMatch) {
        return false;
      }
    }

    return true;
  });
}
