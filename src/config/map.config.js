/**
 * Configuration cartographique Leaflet
 * Thème: Tuiles OpenStreetMap haute disponibilité avec filtre sombre nocturne (Zéro clé API requise)
 */

export const MAP_CONFIG = Object.freeze({
  DEFAULT_CENTER: [48.8566, 2.3522],
  DEFAULT_ZOOM: 12,
  MIN_ZOOM: 11,
  MAX_ZOOM: 18,
  MAX_BOUNDS: [
    [48.75, 2.15], // Sud-Ouest
    [48.95, 2.55]  // Nord-Est
  ],
  TILES: {
    URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    SUBDOMAINS: 'abc',
    MAX_ZOOM: 19
  }
});
