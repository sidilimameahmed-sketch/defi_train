/**
 * Composant Fiche Détaillée Coulissante « Bottom Sheet » (F4)
 * Projet: Visualisez l'OpenData au clair de lune
 */

import { eventBus } from '../core/eventBus.js';
import { appState } from '../core/state.js';
import { CATEGORIES, EVENTS } from '../core/constants.js';

export class BottomSheetComponent {
  constructor(containerId = 'bottom-sheet') {
    this.container = document.getElementById(containerId);
    this.currentCenter = null;
    this.init();
  }

  init() {
    if (!this.container) {
      console.warn('[BottomSheet] Conteneur non trouvé');
      return;
    }

    this.renderInitial();
    this.bindEvents();
    this.listenToState();
  }

  renderInitial() {
    this.container.innerHTML = `
      <div class="bottom-sheet-handle-area" id="bottom-sheet-handle">
        <div class="bottom-sheet-drag-pill"></div>
      </div>
      <div class="bottom-sheet-header">
        <div id="bottom-sheet-title-area"></div>
        <button id="bottom-sheet-close-btn" class="bottom-sheet-close-btn" title="Fermer la fiche" aria-label="Fermer">✕</button>
      </div>
      <div class="bottom-sheet-content" id="bottom-sheet-content"></div>
    `;

    this.injectStyles();
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .detail-badge-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-bottom: 0.35rem;
      }
      .detail-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1.25;
      }
      .detail-category-subtitle {
        font-size: 0.78rem;
        color: var(--text-muted);
        margin-top: 2px;
      }
      .detail-highlight-card {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: var(--radius-md);
        padding: 0.85rem 1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .detail-highlight-label {
        font-size: 0.75rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.03em;
        font-weight: 600;
      }
      .detail-highlight-value {
        font-size: 1.15rem;
        font-weight: 700;
        font-family: var(--font-mono);
      }
      .detail-section {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
      }
      .detail-section-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      .detail-section-text {
        font-size: 0.88rem;
        color: var(--text-secondary);
        line-height: 1.4;
      }
      .detail-actions-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-top: 0.5rem;
        flex-wrap: wrap;
      }
      .detail-action-btn {
        flex: 1 1 160px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.45rem;
        padding: 0.65rem 1rem;
        border-radius: var(--radius-md);
        font-size: 0.85rem;
        font-weight: 600;
        text-align: center;
        transition: all var(--transition-fast);
        text-decoration: none;
      }
      .btn-phone {
        background: rgba(0, 240, 255, 0.15);
        color: var(--neon-ssp);
        border: 1px solid rgba(0, 240, 255, 0.35);
      }
      .btn-phone:hover {
        background: rgba(0, 240, 255, 0.25);
        box-shadow: 0 0 12px rgba(0, 240, 255, 0.35);
      }
      .btn-maps {
        background: rgba(255, 255, 255, 0.06);
        color: var(--text-primary);
        border: 1px solid rgba(255, 255, 255, 0.15);
      }
      .btn-maps:hover {
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(255, 255, 255, 0.3);
      }
    `;
    document.head.appendChild(style);
  }

  bindEvents() {
    const closeBtn = this.container.querySelector('#bottom-sheet-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.close();
      });
    }

    // Touche Échap pour fermer
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.container.classList.contains('is-visible')) {
        this.close();
      }
    });

    // Gestion tactile de fermeture vers le bas sur mobile
    let touchStartY = 0;
    const handleArea = this.container.querySelector('#bottom-sheet-handle');
    if (handleArea) {
      handleArea.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      handleArea.addEventListener('touchmove', (e) => {
        const deltaY = e.touches[0].clientY - touchStartY;
        if (deltaY > 60) {
          this.close();
        }
      }, { passive: true });
    }
  }

  listenToState() {
    eventBus.on(EVENTS.CENTER_SELECTED, ({ center }) => {
      if (center) {
        this.open(center);
      }
    });

    eventBus.on(EVENTS.CENTER_DESELECTED, () => {
      this.close();
    });
  }

  /**
   * Ouvre et remplit la fiche détaillée pour un centre donné
   * @param {Object} center CenterEntity
   */
  open(center) {
    this.currentCenter = center;
    const cat = CATEGORIES[center.category] || CATEGORIES.CHU;

    const titleArea = this.container.querySelector('#bottom-sheet-title-area');
    const contentArea = this.container.querySelector('#bottom-sheet-content');

    const nightBadge = center.isNightActive
      ? `<span class="badge badge-night animate-pulse-glow">🌙 Actif la nuit (24h/24)</span>`
      : `<span class="badge" style="background: rgba(255,255,255,0.06); color: var(--text-muted);">☀️ Diurne (Fermé la nuit)</span>`;

    const cleanPhone = (center.phone || '').replace(/[^\d+]/g, '');
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(center.name + ' ' + center.address)}`;

    if (titleArea) {
      titleArea.innerHTML = `
        <div class="detail-badge-group">
          <span class="badge badge-${center.category.toLowerCase()}">${center.category}</span>
          ${nightBadge}
        </div>
        <h2 class="detail-title">${center.name}</h2>
        <div class="detail-category-subtitle">${center.categoryLabel}</div>
      `;
    }

    if (contentArea) {
      contentArea.innerHTML = `
        <!-- Capacité en lits -->
        <div class="detail-highlight-card">
          <div>
            <div class="detail-highlight-label">Capacité d'accueil</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">Hébergement d'urgence & réinsertion</div>
          </div>
          <div class="detail-highlight-value" style="color: ${center.capacity > 0 ? 'var(--neon-chrs)' : 'var(--text-muted)'};">
            ${center.capacity > 0 ? `🛏️ ${center.capacity} lits` : 'Service sans lits'}
          </div>
        </div>

        <!-- Adresse & Arrondissement -->
        <div class="detail-section">
          <div class="detail-section-label">Localisation</div>
          <div class="detail-section-text">
            📍 <strong>${center.address}</strong>
            ${center.arrondissement ? `<br><span style="color: var(--neon-ssp);">Paris ${center.arrondissement}e arrondissement</span>` : ''}
          </div>
        </div>

        <!-- Public accueilli -->
        <div class="detail-section">
          <div class="detail-section-label">Public accueilli & Spécificités</div>
          <div class="detail-section-text">${center.publicTarget}</div>
        </div>

        <!-- Horaires & Dispositif nocturne -->
        <div class="detail-section">
          <div class="detail-section-label">Horaires & Permanence nocturne</div>
          <div class="detail-section-text">
            ⏰ ${center.hoursDescription}<br>
            <span style="color: ${center.isNightActive ? 'var(--neon-chu)' : 'var(--text-muted)'}; font-size: 0.82rem;">
              ${center.nightDescription}
            </span>
          </div>
        </div>

        <!-- Boutons d'action : Téléphone & Itinéraire -->
        <div class="detail-actions-row">
          ${cleanPhone ? `
            <a href="tel:${cleanPhone}" class="detail-action-btn btn-phone" title="Appeler le centre">
              📞 Appeler (${center.phone})
            </a>
          ` : ''}
          <a href="${mapUrl}" target="_blank" rel="noopener noreferrer" class="detail-action-btn btn-maps" title="Ouvrir dans Google Maps">
            🗺️ Itinéraire
          </a>
        </div>
      `;
    }

    this.container.classList.add('is-visible');
    this.container.setAttribute('aria-hidden', 'false');
  }

  /**
   * Ferme la fiche détaillée
   */
  close() {
    this.container.classList.remove('is-visible');
    this.container.setAttribute('aria-hidden', 'true');
    this.currentCenter = null;
    appState.selectCenter(null);
  }
}
