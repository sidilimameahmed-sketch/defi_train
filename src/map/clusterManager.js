/**
 * Gestionnaire de Couches et Performance Cartographique
 * Projet: Visualisez l'OpenData au clair de lune
 */

import L from 'leaflet';
import { createNeonMarker } from './markerFactory.js';

export class ClusterManager {
  constructor(map) {
    this.map = map;
    this.markersLayer = L.layerGroup().addTo(this.map);
    this.markersMap = new Map(); // id -> L.Marker
  }

  /**
   * Efface l'ensemble des marqueurs existants
   */
  clear() {
    this.markersLayer.clearLayers();
    this.markersMap.clear();
  }

  /**
   * Ajoute une liste de centres sous forme de marqueurs
   * @param {Array<Object>} centers Liste de CenterEntity
   * @param {Function} [onSelectCallback]
   */
  setMarkers(centers, onSelectCallback) {
    this.clear();

    if (!Array.isArray(centers) || centers.length === 0) return;

    for (const center of centers) {
      if (!center.coordinates || typeof center.coordinates.lat !== 'number' || typeof center.coordinates.lng !== 'number') {
        continue;
      }

      const marker = createNeonMarker(center, onSelectCallback);
      this.markersLayer.addLayer(marker);
      this.markersMap.set(center.id, marker);
    }
  }

  /**
   * Récupère un marqueur par son identifiant
   * @param {string} centerId
   * @returns {L.Marker|undefined}
   */
  getMarker(centerId) {
    return this.markersMap.get(centerId);
  }

  /**
   * Applique le mode Focus Nuit sur les marqueurs
   * @param {boolean} isNightFocusActive
   */
  setNightFocusMode(isNightFocusActive) {
    const mapContainer = this.map.getContainer();
    if (isNightFocusActive) {
      mapContainer.classList.add('night-focus-mode');
    } else {
      mapContainer.classList.remove('night-focus-mode');
    }
  }
}
