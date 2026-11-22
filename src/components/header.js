/**
 * Composant Header Immersif & Lune Interactive
 * Projet: Visualisez l'OpenData au clair de lune
 */

import { eventBus } from '../core/eventBus.js';
import { appState } from '../core/state.js';
import { EVENTS } from '../core/constants.js';

export class HeaderComponent {
  constructor(containerId = 'header') {
    this.container = document.getElementById(containerId);
    this.moonClicks = 0;
    this.clickTimer = null;
    this.init();
  }

  init() {
    if (!this.container) {
      console.warn('[Header] Conteneur non trouvé');
      return;
    }
    this.render();
    this.bindEvents();
    this.listenToState();
  }

  render() {
    this.container.innerHTML = `
      <div class="header-brand">
        <button id="moon-trigger" class="header-logo-icon" title="Clair de Lune — Cliquez pour observer les étoiles" aria-label="Lune interactive">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#E2E8F0" stroke="#94A3B8"></path>
          </svg>
        </button>
        <div class="header-titles">
          <h1 class="header-main-title">Visualisez l'OpenData au clair de lune</h1>
          <span class="header-sub-title">
            <span class="header-badge-apside">Défi Apside</span>
            <span>•</span>
            <span>Cartographie nocturne de la solidarité parisienne</span>
          </span>
        </div>
      </div>

      <div class="header-actions">
        <button id="header-chart-btn" class="header-chart-toggle-btn" title="Ouvrir les graphiques analytiques (F6)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <span>Graphiques</span>
        </button>

        <div class="header-status-pill" id="header-status-pill">
          <span class="status-dot" id="header-status-dot"></span>
          <span id="header-status-text">Initialisation...</span>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const chartBtn = this.container.querySelector('#header-chart-btn');
    if (chartBtn) {
      chartBtn.addEventListener('click', () => {
        eventBus.emit('ui:toggle_chart');
      });
    }

    const moonBtn = this.container.querySelector('#moon-trigger');
    if (moonBtn) {
      moonBtn.addEventListener('click', () => {
        this.moonClicks++;
        
        // Animation tactile de secousse/pulse
        moonBtn.classList.remove('animate-heartbeat');
        void moonBtn.offsetWidth; // Reflow
        moonBtn.classList.add('animate-heartbeat');

        if (this.clickTimer) clearTimeout(this.clickTimer);

        if (this.moonClicks >= 3) {
          // Déclencheur Easter Egg (F8)
          eventBus.emit(EVENTS.EASTER_EGG_TRIGGERED, {
            secretCode: 'clair-de-lune',
            action: 'starfall_and_fullmoon_theme'
          });
          this.moonClicks = 0;
        } else {
          this.clickTimer = setTimeout(() => {
            this.moonClicks = 0;
          }, 1200);
        }
      });
    }
  }

  listenToState() {
    const statusDot = this.container.querySelector('#header-status-dot');
    const statusText = this.container.querySelector('#header-status-text');

    eventBus.on(EVENTS.DATA_LOADING, () => {
      if (statusDot) {
        statusDot.className = 'status-dot loading';
      }
      if (statusText) {
        statusText.textContent = 'Chargement OpenData...';
      }
    });

    eventBus.on(EVENTS.DATA_LOADED, ({ meta }) => {
      if (statusDot) {
        statusDot.className = 'status-dot';
      }
      if (statusText) {
        const sourceLabel = meta.source === 'live_api' ? 'En direct' : 'Mode Secours';
        statusText.textContent = `Données connectées (${sourceLabel})`;
      }
    });

    eventBus.on(EVENTS.DATA_FALLBACK_USED, () => {
      if (statusDot) {
        statusDot.className = 'status-dot';
      }
      if (statusText) {
        statusText.textContent = 'Mode Secours (Hors-ligne)';
      }
    });

    eventBus.on(EVENTS.DATA_ERROR, (error) => {
      if (statusDot) {
        statusDot.className = 'status-dot error';
      }
      if (statusText) {
        statusText.textContent = 'Erreur réseau';
      }
    });
  }
}
