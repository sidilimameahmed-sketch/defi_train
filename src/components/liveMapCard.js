/**
 * Composant Live Map Card
 * Conforme au design « La solidarité, quartier par quartier »
 */

import { eventBus } from '../core/eventBus.js';
import { appState } from '../core/state.js';
import { EVENTS } from '../core/constants.js';
import { applyFilters } from '../services/filterService.js';

export class LiveMapCardComponent {
  constructor(containerId = 'map-card') {
    this.container = document.getElementById(containerId);
    this.activeCategory = null; // null = Tous
    this.searchTerm = '';
    this.init();
  }

  init() {
    if (!this.container) return;
    this.render();
    this.bindEvents();
    this.listenToState();
  }

  render() {
    this.container.innerHTML = `
      <div class="map-card-header">
        <div class="map-title-wrap">
          <span class="map-tag">• LIVE MAP</span>
          <h2 class="map-title">La solidarité, quartier par quartier</h2>
        </div>

        <div class="map-legend-pills">
          <div class="legend-item">
            <span class="dot-night-active"></span>
            <span>Ouvert la nuit</span>
          </div>
          <div class="legend-item">
            <span class="dot-available"></span>
            <span>Disponible</span>
          </div>
        </div>
      </div>

      <!-- Barre de recherche et onglets de filtres -->
      <div class="map-controls-row">
        <div class="map-search-wrap">
          <svg class="map-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            id="map-search-input" 
            class="map-search-input" 
            placeholder="Rechercher un centre ou une adresse..." 
            aria-label="Recherche"
            autocomplete="off"
          />
          <span class="map-search-cmd">⌘ K</span>
        </div>

        <div class="map-filter-tabs" role="tablist">
          <button class="map-filter-tab is-active" data-cat="all" role="tab" aria-selected="true">
            <span>Tous</span>
            <span id="tab-count-all" style="opacity: 0.7;">25</span>
          </button>
          <button class="map-filter-tab" data-cat="CHU" role="tab" aria-selected="false">
            <span>CHU</span>
            <span id="tab-count-chu" style="opacity: 0.7;">3</span>
          </button>
          <button class="map-filter-tab" data-cat="CHRS" role="tab" aria-selected="false">
            <span>CHRS</span>
            <span id="tab-count-chrs" style="opacity: 0.7;">5</span>
          </button>
          <button class="map-filter-tab" data-cat="SSP" role="tab" aria-selected="false">
            <span>SSP</span>
            <span id="tab-count-ssp" style="opacity: 0.7;">17</span>
          </button>
        </div>
      </div>

      <!-- Viewport de la carte Leaflet -->
      <div class="map-viewport">
        <div id="map-container"></div>
        <div class="map-status-floating-pill">
          <span class="live-dot"></span>
          <span id="map-floating-pill-text">25 lieux visibles | 10 actifs cette nuit</span>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // 1. Recherche clavier
    const searchInput = this.container.querySelector('#map-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value;
        this.triggerFilter();
      });
    }

    // 2. Raccourci clavier ⌘ K ou Ctrl + K
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (searchInput) searchInput.focus();
      }
    });

    // 3. Onglets de filtres
    const tabs = this.container.querySelectorAll('.map-filter-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');

        const cat = tab.getAttribute('data-cat');
        this.activeCategory = cat === 'all' ? null : cat;
        this.triggerFilter();
      });
    });
  }

  triggerFilter() {
    const { rawData, nightFocusMode } = appState.getState();
    const criteria = {
      searchTerm: this.searchTerm,
      categories: this.activeCategory ? [this.activeCategory] : [],
      nightFocusOnly: nightFocusMode
    };

    const filtered = applyFilters(rawData, criteria);
    appState.setFilteredData(filtered, criteria);
  }

  listenToState() {
    eventBus.on(EVENTS.DATA_LOADED, () => {
      this.updateCounts();
    });

    eventBus.on(EVENTS.FILTER_CHANGED, () => {
      this.updatePillText();
    });

    eventBus.on(EVENTS.FOCUS_TOGGLED, () => {
      this.triggerFilter();
    });
  }

  updateCounts() {
    const { rawData } = appState.getState();
    let chu = 0, chrs = 0, ssp = 0;
    for (const c of rawData) {
      if (c.category === 'CHU') chu++;
      else if (c.category === 'CHRS') chrs++;
      else if (c.category === 'SSP') ssp++;
    }

    const allEl = this.container.querySelector('#tab-count-all');
    const chuEl = this.container.querySelector('#tab-count-chu');
    const chrsEl = this.container.querySelector('#tab-count-chrs');
    const sspEl = this.container.querySelector('#tab-count-ssp');

    if (allEl) allEl.textContent = rawData.length || 25;
    if (chuEl) chuEl.textContent = chu || 3;
    if (chrsEl) chrsEl.textContent = chrs || 5;
    if (sspEl) sspEl.textContent = ssp || 17;

    this.updatePillText();
  }

  updatePillText() {
    const { filteredData, rawData } = appState.getState();
    const pill = this.container.querySelector('#map-floating-pill-text');
    if (!pill) return;

    const visible = filteredData.length;
    const nightActive = filteredData.filter((c) => c.isNightActive).length;
    pill.textContent = `${visible} lieux visibles | ${nightActive} actifs cette nuit`;
  }
}
