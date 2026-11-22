/**
 * Composant Hero Section
 * Conforme au design « Paris veille, nous aussi. »
 */

import { eventBus } from '../core/eventBus.js';
import { appState } from '../core/state.js';
import { EVENTS } from '../core/constants.js';

export class HeroSectionComponent {
  constructor(containerId = 'hero-section') {
    this.container = document.getElementById(containerId);
    this.moonClicks = 0;
    this.clickTimer = null;
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
      <div class="hero-left">
        <span class="hero-tag">— LA NUIT EN CHIFFRES •</span>
        <h1 class="hero-title">
          Paris veille,
          <span class="hero-lime">nous aussi.</span>
        </h1>
        <p class="hero-description">
          Explorez les lieux d'accueil et les services sociaux qui restent ouverts quand la ville s'endort.
        </p>
      </div>

      <div class="hero-right-controls">
        <!-- Widget Lune -->
        <div class="moon-widget">
          <div class="moon-graphic" id="hero-moon-graphic" title="Phase lunaire — Cliquez pour observer les étoiles" aria-label="Lune"></div>
          <div class="moon-info">
            <span class="moon-info-label">PHASE ACTUELLE</span>
            <span class="moon-info-val">Premier quartier</span>
            <span class="moon-info-date">22 NOV 03:56</span>
          </div>
        </div>

        <div class="focus-divider"></div>

        <!-- Toggle Focus Nuit (F5) -->
        <div class="focus-nuit-toggle" id="focus-nuit-toggle" role="switch" aria-checked="false" title="Activer / Désactiver le Mode Focus Nuit">
          <span class="focus-nuit-label">Mode focus nuit</span>
          <div class="toggle-switch"></div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // 1. Déclencheur Easter Egg au triple-clic sur la lune
    const moonGraphic = this.container.querySelector('#hero-moon-graphic');
    if (moonGraphic) {
      moonGraphic.addEventListener('click', () => {
        this.moonClicks++;
        moonGraphic.classList.remove('animate-heartbeat');
        void moonGraphic.offsetWidth;
        moonGraphic.classList.add('animate-heartbeat');

        if (this.clickTimer) clearTimeout(this.clickTimer);

        if (this.moonClicks >= 3) {
          eventBus.emit(EVENTS.EASTER_EGG_TRIGGERED, { secretCode: 'clair-de-lune' });
          this.moonClicks = 0;
        } else {
          this.clickTimer = setTimeout(() => {
            this.moonClicks = 0;
          }, 1200);
        }
      });
    }

    // 2. Bascule Mode Focus Nuit
    const toggle = this.container.querySelector('#focus-nuit-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const { nightFocusMode } = appState.getState();
        appState.toggleNightFocus(!nightFocusMode);
      });
    }
  }

  listenToState() {
    const toggle = this.container.querySelector('#focus-nuit-toggle');
    eventBus.on(EVENTS.FOCUS_TOGGLED, ({ isEnabled }) => {
      if (toggle) {
        if (isEnabled) {
          toggle.classList.add('is-active');
          toggle.setAttribute('aria-checked', 'true');
        } else {
          toggle.classList.remove('is-active');
          toggle.setAttribute('aria-checked', 'false');
        }
      }
    });
  }
}
