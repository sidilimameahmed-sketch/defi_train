/**
 * Constantes Métier, Événements et Thème Néon
 * Projet: Visualisez l'OpenData au clair de lune
 */

export const CATEGORIES = Object.freeze({
  CHU: {
    code: 'CHU',
    label: "Centre d'Hébergement d'Urgence",
    shortLabel: 'Hébergement Urgence',
    color: '#39FF14', // Vert Néon
    glowColor: 'rgba(57, 255, 20, 0.45)',
    description: "Structure d'accueil d'urgence immédiate inconditionnelle, ouverte en permanence ou de nuit."
  },
  CHRS: {
    code: 'CHRS',
    label: "Centre d'Hébergement et de Réinsertion Sociale",
    shortLabel: 'Réinsertion Sociale',
    color: '#FFE600', // Jaune Néon
    glowColor: 'rgba(255, 230, 0, 0.45)',
    description: "Établissement assurant l'hébergement et l'accompagnement vers l'autonomie et le logement."
  },
  SSP: {
    code: 'SSP',
    label: 'Service Social de Proximité',
    shortLabel: 'Action Sociale Proximité',
    color: '#00F0FF', // Cyan Électrique
    glowColor: 'rgba(0, 240, 255, 0.45)',
    description: "Structure municipale polyvalente d'accueil, d'orientation et de suivi social de quartier."
  },
  CASVP: {
    code: 'CASVP',
    label: "Centre d'Action Sociale de la Ville de Paris",
    shortLabel: 'Action Sociale Paris',
    color: '#D946EF', // Magenta / Violet
    glowColor: 'rgba(217, 70, 239, 0.45)',
    description: "Services spécialisés pour seniors, personnes en situation de précarité ou d'exclusion."
  }
});

export const CATEGORY_KEYS = Object.keys(CATEGORIES);

export const THEME = Object.freeze({
  BG_PRIMARY: '#070A13',
  BG_SECONDARY: '#0F172A',
  BG_CARD: 'rgba(15, 23, 42, 0.75)',
  BG_GLASS: 'rgba(15, 23, 42, 0.85)',
  TEXT_PRIMARY: '#F8FAFC',
  TEXT_MUTED: '#94A3B8',
  MOON_SILVER: '#E2E8F0',
  BORDER_GLASS: 'rgba(255, 255, 255, 0.1)'
});

export const EVENTS = Object.freeze({
  DATA_LOADING: 'data:loading',
  DATA_LOADED: 'data:loaded',
  DATA_ERROR: 'data:error',
  DATA_FALLBACK_USED: 'data:fallback_used',
  FILTER_CHANGED: 'filter:changed',
  CENTER_SELECTED: 'center:selected',
  CENTER_DESELECTED: 'center:deselected',
  FOCUS_TOGGLED: 'focus:toggled',
  EASTER_EGG_TRIGGERED: 'easteregg:triggered'
});

export const ARRONDISSEMENTS = Array.from({ length: 20 }, (_, i) => i + 1);
