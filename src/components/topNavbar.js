/**
 * Composant Top Navbar
 * Conforme au design « Paris Veille »
 */

import { eventBus } from '../core/eventBus.js';
import { EVENTS } from '../core/constants.js';

export class TopNavbarComponent {
  constructor(containerId = 'top-navbar') {
    this.container = document.getElementById(containerId);
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
      <div class="nav-brand">
        <span>PARIS</span>
        <span>/</span>
        <span>SERVICE SOCIAL</span>
        <span class="nav-brand-highlight">| NUIT</span>
      </div>

      <div class="nav-right-meta">
        <div class="nav-live-pill">
          <span class="live-dot" id="live-indicator-dot"></span>
          <span id="live-time-text">DONNÉES ACTUALISÉES À 04:49</span>
        </div>

        <div class="nav-moon-phase">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" fill="#D4FF32" stroke="#D4FF32"></path>
          </svg>
          <span style="color: var(--neon-lime); font-size: 0.72rem; font-weight: 600;">Premier quartier</span>
        </div>

        <button class="nav-refresh-btn" id="nav-refresh-btn" title="Actualiser les flux OpenData" aria-label="Actualiser">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
          </svg>
        </button>
      </div>
    `;
  }

  bindEvents() {
    const refreshBtn = this.container.querySelector('#nav-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        refreshBtn.style.transform = 'rotate(360deg)';
        eventBus.emit('data:request_refresh');
        setTimeout(() => {
          refreshBtn.style.transform = 'none';
        }, 600);
      });
    }
  }

  listenToState() {
    const timeText = this.container.querySelector('#live-time-text');
    eventBus.on(EVENTS.DATA_LOADED, () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      if (timeText) {
        timeText.textContent = `DONNÉES ACTUALISÉES À ${hours}:${minutes}`;
      }
    });
  }
}
