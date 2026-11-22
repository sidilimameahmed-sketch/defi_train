/**
 * Point d'Entrée Principal (SPA Application Root)
 * Projet: Visualisez l'OpenData au clair de lune
 * Défi Apside — Futur des données ouvertes — La Nuit
 * Design: Paris veille, nous aussi.
 */

import './assets/css/style.css';
import { eventBus } from './core/eventBus.js';
import { appState } from './core/state.js';
import { EVENTS } from './core/constants.js';
import { TopNavbarComponent } from './components/topNavbar.js';
import { HeroSectionComponent } from './components/heroSection.js';
import { KpiGridComponent } from './components/kpiGrid.js';
import { LiveMapCardComponent } from './components/liveMapCard.js';
import { RythmeNuitCardComponent } from './components/rythmeNuitCard.js';
import { BottomGridComponent } from './components/bottomGrid.js';
import { FooterComponent } from './components/footer.js';
import { BottomSheetComponent } from './components/bottomSheet.js';
import { EasterEggComponent } from './components/easterEgg.js';
import { LoadingOverlay } from './components/loadingOverlay.js';
import { MapManager } from './map/mapManager.js';
import { openDataService } from './services/openDataService.js';

class App {
  constructor() {
    this.topNavbar = null;
    this.heroSection = null;
    this.kpiGrid = null;
    this.liveMapCard = null;
    this.mapManager = null;
    this.rythmeCard = null;
    this.bottomGrid = null;
    this.footer = null;
    this.bottomSheet = null;
    this.easterEgg = null;
    this.loadingOverlay = null;
  }

  async init() {
    console.log("🌙 [Paris Veille] Démarrage de l'application — Défi Apside");

    // 1. Montage de l'overlay de chargement
    this.loadingOverlay = new LoadingOverlay();

    // 2. Montage des sections UI
    this.topNavbar = new TopNavbarComponent('top-navbar');
    this.heroSection = new HeroSectionComponent('hero-section');
    this.kpiGrid = new KpiGridComponent('kpi-grid');
    this.liveMapCard = new LiveMapCardComponent('map-card');

    // 3. Montage du gestionnaire Leaflet
    this.mapManager = new MapManager('map-container');

    // 4. Montage des graphiques et grilles
    this.rythmeCard = new RythmeNuitCardComponent('rythme-card');
    this.bottomGrid = new BottomGridComponent('bottom-grid');
    this.footer = new FooterComponent('footer');

    // 5. Composants interactifs modaux
    this.bottomSheet = new BottomSheetComponent('bottom-sheet');
    this.easterEgg = new EasterEggComponent('easter-egg-canvas');

    // 6. Écouteurs globaux
    this.setupGlobalListeners();

    // 7. Ingestion OpenData
    await this.loadOpenData();
  }

  setupGlobalListeners() {
    // Synchronisation de la carte aux filtres
    eventBus.on(EVENTS.FILTER_CHANGED, () => {
      const { filteredData } = appState.getState();
      if (this.mapManager) {
        this.mapManager.renderMarkers(filteredData);
      }
    });

    // Demande de rafraîchissement
    eventBus.on('data:request_refresh', async () => {
      await this.loadOpenData(true);
    });

    // Effet stellaire Easter Egg
    eventBus.on(EVENTS.EASTER_EGG_TRIGGERED, () => {
      const appEl = document.getElementById('app');
      if (appEl) {
        appEl.style.transition = 'box-shadow 0.8s ease-in-out';
        appEl.style.boxShadow = 'inset 0 0 80px rgba(212, 255, 50, 0.25)';
        setTimeout(() => {
          appEl.style.boxShadow = 'none';
        }, 3500);
      }
    });

    // Invalidation Leaflet au redimensionnement
    window.addEventListener('resize', () => {
      if (this.mapManager) {
        this.mapManager.invalidateSize();
      }
    });
  }

  async loadOpenData(forceRefresh = false) {
    try {
      const response = await openDataService.fetchAllData({ forceRefresh });
      if (response.success && response.data) {
        const { centers, metadata } = response.data;
        appState.setData(centers, metadata.source);

        // Affichage des marqueurs
        if (this.mapManager) {
          this.mapManager.renderMarkers(centers);
        }

        console.log(`✨ [Paris Veille] ${centers.length} structures connectées`);
      }
    } catch (err) {
      console.error("[Paris Veille] Erreur lors du chargement des données:", err);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
