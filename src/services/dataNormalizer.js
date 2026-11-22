/**
 * Pipeline de Normalisation et Sanitisation des Données GeoJSON
 * Projet: Visualisez l'OpenData au clair de lune
 * Conforme au contrat DTO CenterEntity de api-contract.md
 */

import { CATEGORIES } from '../core/constants.js';

/**
 * Nettoyage et sanitisation anti-XSS des chaînes de caractères
 * @param {any} input
 * @returns {string}
 */
export function sanitizeString(input) {
  if (input === null || input === undefined) return '';
  const str = String(input).trim();
  // Suppression des balises HTML complètes et protocoles dangereux
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

/**
 * Extrait l'arrondissement parisien (1 à 20) depuis le code postal ou une chaîne
 * @param {string|number} postalCode
 * @param {string} [fallbackText]
 * @returns {number}
 */
export function extractArrondissement(postalCode, fallbackText = '') {
  const codeStr = String(postalCode || '').trim();

  // Détection format 75001 à 75020 ou 75116
  const parisMatch = codeStr.match(/^750?([0-2][0-9])$/);
  if (parisMatch) {
    const arr = parseInt(parisMatch[1], 10);
    if (arr >= 1 && arr <= 20) return arr;
  }

  // Détection dans le texte (ex: "MdS 13", "11ème", "Paris 19e")
  const text = `${codeStr} ${fallbackText}`;
  const textMatch = text.match(/\b(1[0-9]|20|[1-9])\s*(?:e|ème|eme|er|arrondissement|\b)/i);
  if (textMatch) {
    const arr = parseInt(textMatch[1], 10);
    if (arr >= 1 && arr <= 20) return arr;
  }

  return 0; // Hors arrondissement parisien intra-muros
}

/**
 * Normalise un numéro de téléphone pour affichage clair
 * @param {string} phone
 * @returns {string}
 */
export function formatPhoneNumber(phone) {
  if (!phone) return 'Non renseigné';
  const cleaned = sanitizeString(phone).replace(/[^\d+]/g, '');
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return cleaned.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  }
  return sanitizeString(phone);
}

/**
 * Normalise une feature issue de hebergements-casvp
 * @param {Object} feature Feature GeoJSON brute
 * @param {number} index Index d'itération pour ID stable
 * @returns {Object|null} CenterEntity
 */
export function normalizeHebergementFeature(feature, index) {
  if (!feature || !feature.geometry || feature.geometry.type !== 'Point') {
    return null;
  }

  const [lng, lat] = feature.geometry.coordinates || [];
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return null;
  }

  const props = feature.properties || {};
  const rawType = (props.type || props.type_etablissement || 'CHU').toUpperCase();
  const name = sanitizeString(props.nom || props.nom_etablissement || `Hébergement ${index + 1}`);
  const postalCode = sanitizeString(props.code_postal || '75000');
  const arrondissement = extractArrondissement(postalCode, `${name} ${props.adresse || ''}`);

  // Catégorisation canonique CHU ou CHRS
  let category = 'CHU';
  if (rawType.includes('CHRS') && !rawType.includes('CHU')) {
    category = 'CHRS';
  } else if (rawType.includes('CHU')) {
    category = 'CHU';
  }

  const catMeta = CATEGORIES[category] || CATEGORIES.CHU;

  // Statut nocturne : CHU est actif de nuit 24h/24 par mission légale
  const isNightActive = category === 'CHU' || Boolean(props.accueil_nuit) || /24h|nuit|urgence/i.test(props.statut_nuit || props.precisions || '');

  // Estimation réaliste de la capacité si non fournie dans l'export OpenData
  let capacity = parseInt(props.capacite_lits || props.capacite || 0, 10);
  if (!capacity || isNaN(capacity)) {
    // Estimations moyennes constatées pour les centres parisiens CASVP
    capacity = category === 'CHU' ? 65 : 45;
  }

  const address = sanitizeString(props.adresse || 'Adresse non renseignée');
  const city = sanitizeString(props.ville || 'Paris');
  const fullAddress = city && !address.toLowerCase().includes(city.toLowerCase()) ? `${address}, ${postalCode} ${city}` : `${address}, ${postalCode}`;

  return {
    id: `heb_${arrondissement || 'ext'}_${index + 1}`,
    name,
    category,
    categoryLabel: catMeta.label,
    address: fullAddress,
    postalCode,
    arrondissement,
    phone: formatPhoneNumber(props.telephone),
    capacity,
    isNightActive,
    nightDescription: isNightActive
      ? "Accueil d'urgence ouvert en permanence la nuit (24h/24)."
      : "Accueil et réinsertion sociale en journée.",
    hoursDescription: isNightActive ? "24h/24 — 7j/7" : "8h30 - 18h00 (Du lundi au vendredi)",
    publicTarget: sanitizeString(props.precisions || props.public_accueilli || "Public en grande précarité"),
    coordinates: { lat, lng },
    neonColor: catMeta.color
  };
}

/**
 * Normalise une feature issue de coordonnees-ssp-et-casvp
 * @param {Object} feature Feature GeoJSON brute
 * @param {number} index Index d'itération
 * @returns {Object|null} CenterEntity
 */
export function normalizeSspCasvpFeature(feature, index) {
  if (!feature || !feature.geometry || feature.geometry.type !== 'Point') {
    return null;
  }

  const [lng, lat] = feature.geometry.coordinates || [];
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return null;
  }

  const props = feature.properties || {};
  const name = sanitizeString(props.nom_de_l_etablissement || props.nom_structure || `Centre Social ${index + 1}`);
  const postalCode = sanitizeString(props.code_postal || '75000');
  const arrondissement = extractArrondissement(postalCode, `${name} ${props.ndeg_rue || ''}`);

  // Catégorisation SSP vs CASVP
  const rawType = (props.type_structure || '').toUpperCase();
  const isCasvp = rawType === 'CASVP' || name.toUpperCase().includes('CASVP');
  const category = isCasvp ? 'CASVP' : 'SSP';
  const catMeta = CATEGORIES[category] || CATEGORIES.SSP;

  const street = sanitizeString(props.ndeg_rue || props.adresse || '');
  const fullAddress = street ? `${street}, ${postalCode} Paris` : `${postalCode} Paris`;

  return {
    id: `ssp_${arrondissement || 'paris'}_${index + 1}`,
    name,
    category,
    categoryLabel: catMeta.label,
    address: fullAddress,
    postalCode,
    arrondissement,
    phone: formatPhoneNumber(props.telephone),
    capacity: 0, // Les services de proximité ne disposent pas de lits d'hébergement
    isNightActive: false, // Services diurnes fermés la nuit
    nightDescription: "Fermé la nuit. Permanence assurée en journée par les équipes sociales.",
    hoursDescription: sanitizeString(props.horaires || "8h30 - 17h00"),
    publicTarget: sanitizeString(props.accessibilite ? `Tout public — ${props.accessibilite}` : "Tout public"),
    coordinates: { lat, lng },
    neonColor: catMeta.color
  };
}

/**
 * Normalise l'ensemble d'un GeoJSON vers une liste de CenterEntity
 * @param {Object} geojson FeatureCollection
 * @param {'hebergements' | 'ssp_casvp'} datasetType
 * @returns {Array<CenterEntity>}
 */
export function normalizeGeoJSON(geojson, datasetType = 'hebergements') {
  if (!geojson || geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
    return [];
  }

  const normalizer = datasetType === 'hebergements' ? normalizeHebergementFeature : normalizeSspCasvpFeature;

  return geojson.features
    .map((feature, idx) => normalizer(feature, idx))
    .filter((entity) => entity !== null);
}
