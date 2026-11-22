/**
 * Gestionnaire Principal de la Carte Nocturne Leaflet (MapManager)
 * Projet: Visualisez l'OpenData au clair de lune
 * Fonctionnalité F1 — Carte Nocturne Interactive
 */

import L from 'leaflet';
import { MAP_CONFIG } from '../config/map.config.js';
import { eventBus } from '../core/eventBus.js';
import { appState } from '../core/state.js';
import { EVENTS } from '../core/constants.js';
import { ClusterManager } from './clusterManager.js';

export class MapManager {
  constructor(containerId = 'map-container') {
    this.containerId = containerId;
    this.map = null;
    this.clusterManager = null;
    this.init();
  }

  init() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.warn(`[MapManager] Conteneur #${this.containerId} introuvable`);
      return;
    }

    // 1. Initialisation de la carte Leaflet
    this.map = L.map(this.containerId, {
      center: MAP_CONFIG.DEFAULT_CENTER,
      zoom: MAP_CONFIG.DEFAULT_ZOOM,
      minZoom: MAP_CONFIG.MIN_ZOOM,
      maxZoom: MAP_CONFIG.MAX_ZOOM,
      zoomControl: false, // Repositionné en bas à droite pour l'ergonomie
      attributionControl: true
    });

    // 2. Déplacement du contrôle de zoom
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // 3. Couche de tuiles sombres CartoDB Dark Matter
    L.tileLayer(MAP_CONFIG.TILES.URL, {
      attribution: MAP_CONFIG.TILES.ATTRIBUTION,
      subdomains: MAP_CONFIG.TILES.SUBDOMAINS,
      maxZoom: MAP_CONFIG.TILES.MAX_ZOOM
    }).addTo(this.map);

    // 4. Initialisation du gestionnaire de marqueurs
    this.clusterManager = new ClusterManager(this.map);

    // 5. Écouteurs d'événements cartographiques
    this.bindEvents();
    this.listenToEventBus();

    // Invalidation de la taille dès que le conteneur est stabilisé
    setTimeout(() => {
      this.invalidateSize();
    }, 200);

    console.log("🗺️ [MapManager] Carte nocturne Leaflet initialisée avec tuiles sombres");
  }

  bindEvents() {
    // Clic sur fond de carte pour désélectionner
    this.map.on('click', () => {
      appState.selectCenter(null);
    });
  }

  listenToEventBus() {
    // Recentrage au clic sur un centre
    eventBus.on(EVENTS.CENTER_SELECTED, ({ center }) => {
      if (center && center.coordinates) {
        this.flyToCenter(center.coordinates, 15);
      }
    });

    // Bascule du mode Focus Nuit
    eventBus.on(EVENTS.FOCUS_TOGGLED, ({ isEnabled }) => {
      this.clusterManager.setNightFocusMode(isEnabled);
    });
  }

  /**
   * Affiche l'ensemble des centres fournis
   * @param {Array<Object>} centers
   */
  renderMarkers(centers) {
    if (!this.clusterManager) return;
    this.clusterManager.setMarkers(centers, (center) => {
      this.flyToCenter(center.coordinates, 15);
    });
    this.invalidateSize();
  }

  /**
   * Recentrage fluide (flyTo) vers des coordonnées précises
   * @param {{ lat: number, lng: number }} coords
   * @param {number} [zoom=15]
   */
  flyToCenter(coords, zoom = 15) {
    if (!this.map || !coords) return;
    this.map.flyTo([coords.lat, coords.lng], zoom, {
      animate: true,
      duration: 1.2,
      easeLinearity: 0.25
    });
  }

  /**
   * Réinitialise la vue par défaut sur Paris
   */
  resetView() {
    if (!this.map) return;
    this.map.setView(MAP_CONFIG.DEFAULT_CENTER, MAP_CONFIG.DEFAULT_ZOOM, {
      animate: true
    });
  }

  /**
   * Invalide la taille du conteneur lors des redimensionnements de fenêtre
   */
  invalidateSize() {
    if (this.map) {
      this.map.invalidateSize();
    }
  }
}
