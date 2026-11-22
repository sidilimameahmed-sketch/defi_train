/**
 * Composant Écran de Chargement Sombre (Dark Skeleton & Spinner Néon)
 * Projet: Visualisez l'OpenData au clair de lune
 */

import { eventBus } from '../core/eventBus.js';
import { EVENTS } from '../core/constants.js';

export class LoadingOverlay {
  constructor() {
    this.overlay = null;
    this.init();
  }

  init() {
    this.createElements();
    this.bindEvents();
  }

  createElements() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'loading-overlay';
    this.overlay.className = 'loading-overlay is-hidden';
    this.overlay.innerHTML = `
      <div class="loading-card">
        <div class="loading-moon-spinner">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-pulse-glow">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#E2E8F0" stroke="#94A3B8"></path>
          </svg>
        </div>
        <h3 class="loading-title">Observation du ciel parisien...</h3>
        <p class="loading-subtitle">Connexion aux données ouvertes de la Ville de Paris</p>
        <div class="loading-bar-track">
          <div class="loading-bar-fill"></div>
        </div>
      </div>
    `;

    // Ajout des styles spécifiques pour l'overlay
    const style = document.createElement('style');
    style.textContent = `
      .loading-overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: rgba(7, 10, 19, 0.88);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 1;
        transition: opacity 400ms ease-out, visibility 400ms ease-out;
      }
      .loading-overlay.is-hidden {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
      }
      .loading-card {
        background: var(--bg-glass-card);
        border: var(--glass-border);
        border-radius: var(--radius-lg);
        padding: 2rem 2.5rem;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        max-width: 380px;
        width: 90%;
      }
      .loading-moon-spinner {
        margin-bottom: 1.25rem;
      }
      .loading-title {
        font-size: 1.15rem;
        font-weight: 600;
        margin-bottom: 0.35rem;
        color: var(--text-primary);
      }
      .loading-subtitle {
        font-size: 0.85rem;
        color: var(--text-muted);
        margin-bottom: 1.5rem;
      }
      .loading-bar-track {
        width: 100%;
        height: 4px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: var(--radius-full);
        overflow: hidden;
        position: relative;
      }
      .loading-bar-fill {
        width: 40%;
        height: 100%;
        background: linear-gradient(90deg, var(--neon-chu), var(--neon-ssp), var(--moon-silver));
        border-radius: var(--radius-full);
        animation: loadingSlide 1.5s infinite ease-in-out;
      }
      @keyframes loadingSlide {
        0% { transform: translateX(-100%); }
        50% { transform: translateX(120%); }
        100% { transform: translateX(250%); }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(this.overlay);
  }

  bindEvents() {
    eventBus.on(EVENTS.DATA_LOADING, () => this.show());
    eventBus.on(EVENTS.DATA_LOADED, () => this.hide());
    eventBus.on(EVENTS.DATA_ERROR, () => this.hide());
  }

  show() {
    if (this.overlay) {
      this.overlay.classList.remove('is-hidden');
    }
  }

  hide() {
    if (this.overlay) {
      this.overlay.classList.add('is-hidden');
    }
  }
}
