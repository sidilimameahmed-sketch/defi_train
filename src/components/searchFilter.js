/**
 * Composant Barre de Recherche, Filtres Multicritères & Mode Focus Nuit (F3 & F5)
 * Projet: Visualisez l'OpenData au clair de lune
 */

import { eventBus } from '../core/eventBus.js';
import { appState } from '../core/state.js';
import { CATEGORIES, EVENTS, ARRONDISSEMENTS } from '../core/constants.js';
import { applyFilters } from '../services/filterService.js';

export class SearchFilterComponent {
  constructor(containerId = 'controls') {
    this.container = document.getElementById(containerId);
    this.selectedCategories = new Set(); // Vide = toutes
    this.selectedArrondissement = 0; // 0 = tous
    this.searchTerm = '';
    this.nightFocus = false;
    this.init();
  }

  init() {
    if (!this.container) {
      console.warn('[SearchFilter] Conteneur non trouvé');
      return;
    }

    this.render();
    this.bindEvents();
    this.listenToState();
  }

  render() {
    this.container.innerHTML = `
      <div class="search-filter-panel">
        <!-- Ligne 1 : Champ de recherche et contrôles rapides -->
        <div class="search-row">
          <div class="search-input-wrapper">
            <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              id="search-input" 
              class="search-input" 
              placeholder="Rechercher par nom, rue ou arrondissement (ex: 14e, Bichat, Coty)..."
              aria-label="Recherche de structure"
              autocomplete="off"
            />
            <button id="search-clear-btn" class="search-clear-btn is-hidden" title="Effacer la recherche" aria-label="Effacer">✕</button>
          </div>

          <!-- Sélecteur d'arrondissement -->
          <div class="select-wrapper">
            <select id="arrondissement-select" class="custom-select" aria-label="Filtrer par arrondissement">
              <option value="0">Tout Paris (1er - 20e)</option>
              ${ARRONDISSEMENTS.map((arr) => `<option value="${arr}">${arr}${arr === 1 ? 'er' : 'e'} arrondissement</option>`).join('')}
            </select>
          </div>

          <!-- Bouton Mode Focus Nuit (F5) -->
          <button id="night-focus-btn" class="night-focus-toggle-btn" title="Mode Focus Nuit : faire briller les centres d'urgence ouverts la nuit" aria-pressed="false">
            <span class="focus-moon-icon">🌙</span>
            <span class="focus-btn-label">Focus Nuit</span>
            <span class="focus-indicator"></span>
          </button>

          <!-- Bouton Réinitialiser -->
          <button id="filter-reset-btn" class="filter-reset-btn" title="Réinitialiser tous les filtres" aria-label="Réinitialiser">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
            <span class="reset-label">Effacer</span>
          </button>
        </div>

        <!-- Ligne 2 : Badges de typologie cliquables -->
        <div class="categories-row" role="group" aria-label="Filtres par typologie">
          <span class="filter-tag-label">Typologies :</span>
          ${Object.keys(CATEGORIES).map((key) => {
            const cat = CATEGORIES[key];
            return `
              <button 
                class="category-tag-btn" 
                data-category="${key}"
                style="--cat-color: ${cat.color}; --cat-glow: ${cat.glowColor};"
                aria-pressed="false"
              >
                <span class="tag-color-bullet"></span>
                <span class="tag-text">${cat.code}</span>
                <span class="tag-sub">${cat.shortLabel}</span>
              </button>
            `;
          }).join('')}
          <div class="results-counter" id="results-counter">Calcul en cours...</div>
        </div>
      </div>
    `;

    this.injectStyles();
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .search-filter-panel {
        background: var(--bg-glass);
        backdrop-filter: var(--glass-blur);
        -webkit-backdrop-filter: var(--glass-blur);
        border: var(--glass-border);
        border-radius: var(--radius-lg);
        padding: 0.75rem 1rem;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
      }
      .search-row {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        flex-wrap: wrap;
      }
      .search-input-wrapper {
        position: relative;
        flex: 1 1 260px;
        display: flex;
        align-items: center;
      }
      .search-icon {
        position: absolute;
        left: 12px;
        color: var(--neon-ssp);
        pointer-events: none;
      }
      .search-input {
        width: 100%;
        padding: 0.55rem 2.2rem 0.55rem 2.5rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: var(--radius-md);
        font-size: 0.88rem;
        color: var(--text-primary);
        transition: border-color var(--transition-fast), background var(--transition-fast), box-shadow var(--transition-fast);
      }
      .search-input:focus {
        border-color: var(--neon-ssp);
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 0 12px rgba(0, 240, 255, 0.25);
      }
      .search-clear-btn {
        position: absolute;
        right: 10px;
        color: var(--text-muted);
        font-size: 0.9rem;
        padding: 2px 6px;
        border-radius: 50%;
        transition: color var(--transition-fast);
      }
      .search-clear-btn:hover {
        color: var(--text-primary);
      }
      .search-clear-btn.is-hidden {
        display: none;
      }
      .select-wrapper {
        flex: 0 1 180px;
      }
      .custom-select {
        width: 100%;
        padding: 0.55rem 0.75rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: var(--radius-md);
        font-size: 0.82rem;
        color: var(--text-primary);
        cursor: pointer;
      }
      .custom-select option {
        background: var(--bg-secondary);
        color: var(--text-primary);
      }
      .night-focus-toggle-btn {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.55rem 0.9rem;
        border-radius: var(--radius-md);
        background: rgba(99, 102, 241, 0.15);
        border: 1px solid rgba(99, 102, 241, 0.4);
        color: #C7D2FE;
        font-size: 0.82rem;
        font-weight: 600;
        transition: all var(--transition-fast);
      }
      .night-focus-toggle-btn:hover {
        background: rgba(99, 102, 241, 0.25);
        border-color: rgba(99, 102, 241, 0.7);
        box-shadow: 0 0 14px rgba(99, 102, 241, 0.35);
      }
      .night-focus-toggle-btn.is-active {
        background: rgba(57, 255, 20, 0.2);
        border-color: var(--neon-chu);
        color: var(--neon-chu);
        box-shadow: 0 0 16px rgba(57, 255, 20, 0.4);
      }
      .focus-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transition: background var(--transition-fast), box-shadow var(--transition-fast);
      }
      .night-focus-toggle-btn.is-active .focus-indicator {
        background: var(--neon-chu);
        box-shadow: 0 0 8px var(--neon-chu);
      }
      .filter-reset-btn {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.55rem 0.75rem;
        border-radius: var(--radius-md);
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--text-muted);
        font-size: 0.8rem;
        transition: all var(--transition-fast);
      }
      .filter-reset-btn:hover {
        color: var(--text-primary);
        background: rgba(255, 255, 255, 0.1);
      }
      .categories-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
        font-size: 0.8rem;
      }
      .filter-tag-label {
        color: var(--text-muted);
        font-weight: 500;
        margin-right: 0.2rem;
      }
      .category-tag-btn {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.3rem 0.65rem;
        border-radius: var(--radius-full);
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--text-secondary);
        font-size: 0.75rem;
        transition: all var(--transition-fast);
      }
      .category-tag-btn:hover {
        background: rgba(255, 255, 255, 0.09);
        border-color: rgba(255, 255, 255, 0.25);
      }
      .tag-color-bullet {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--cat-color);
        box-shadow: 0 0 4px var(--cat-color);
      }
      .category-tag-btn.is-active {
        background: rgba(255, 255, 255, 0.12);
        border-color: var(--cat-color);
        color: #FFFFFF;
        box-shadow: 0 0 10px var(--cat-glow);
      }
      .category-tag-btn.is-active .tag-text {
        color: var(--cat-color);
        font-weight: 700;
      }
      .tag-sub {
        font-size: 0.68rem;
        color: var(--text-muted);
      }
      .results-counter {
        margin-left: auto;
        font-size: 0.75rem;
        color: var(--text-muted);
        font-family: var(--font-mono);
      }
      @media (max-width: 768px) {
        .tag-sub { display: none; }
        .reset-label { display: none; }
        .results-counter { width: 100%; margin-left: 0; text-align: right; }
      }
    `;
    document.head.appendChild(style);
  }

  bindEvents() {
    // 1. Saisie recherche
    const searchInput = this.container.querySelector('#search-input');
    const clearBtn = this.container.querySelector('#search-clear-btn');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value;
        if (clearBtn) {
          if (this.searchTerm.length > 0) {
            clearBtn.classList.remove('is-hidden');
          } else {
            clearBtn.classList.add('is-hidden');
          }
        }
        this.onFilterChange();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          this.searchTerm = '';
          clearBtn.classList.add('is-hidden');
          this.onFilterChange();
          searchInput.focus();
        }
      });
    }

    // 2. Sélecteur d'arrondissement
    const select = this.container.querySelector('#arrondissement-select');
    if (select) {
      select.addEventListener('change', (e) => {
        this.selectedArrondissement = parseInt(e.target.value, 10) || 0;
        this.onFilterChange();
      });
    }

    // 3. Badges de typologie
    const catBtns = this.container.querySelectorAll('.category-tag-btn');
    catBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-category');
        if (this.selectedCategories.has(cat)) {
          this.selectedCategories.delete(cat);
          btn.classList.remove('is-active');
          btn.setAttribute('aria-pressed', 'false');
        } else {
          this.selectedCategories.add(cat);
          btn.classList.add('is-active');
          btn.setAttribute('aria-pressed', 'true');
        }
        this.onFilterChange();
      });
    });

    // 4. Bouton Mode Focus Nuit (F5)
    const nightBtn = this.container.querySelector('#night-focus-btn');
    if (nightBtn) {
      nightBtn.addEventListener('click', () => {
        this.nightFocus = !this.nightFocus;
        appState.toggleNightFocus(this.nightFocus);
      });
    }

    // 5. Bouton Réinitialiser
    const resetBtn = this.container.querySelector('#filter-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetAllFilters();
      });
    }
  }

  listenToState() {
    // Écoute de l'état Focus Nuit modifié ailleurs (ex: raccourci ou state)
    eventBus.on(EVENTS.FOCUS_TOGGLED, ({ isEnabled }) => {
      this.nightFocus = isEnabled;
      const nightBtn = this.container.querySelector('#night-focus-btn');
      if (nightBtn) {
        if (isEnabled) {
          nightBtn.classList.add('is-active');
          nightBtn.setAttribute('aria-pressed', 'true');
        } else {
          nightBtn.classList.remove('is-active');
          nightBtn.setAttribute('aria-pressed', 'false');
        }
      }
      this.onFilterChange();
    });

    // Données initiales chargées
    eventBus.on(EVENTS.DATA_LOADED, () => {
      this.onFilterChange();
    });
  }

  onFilterChange() {
    const { rawData } = appState.getState();
    const criteria = {
      searchTerm: this.searchTerm,
      categories: Array.from(this.selectedCategories),
      arrondissements: this.selectedArrondissement > 0 ? [this.selectedArrondissement] : [],
      nightFocusOnly: this.nightFocus
    };

    const filtered = applyFilters(rawData, criteria);
    appState.setFilteredData(filtered, criteria);

    // Mise à jour du compteur de résultats
    const counter = this.container.querySelector('#results-counter');
    if (counter) {
      counter.textContent = `${filtered.length} structure${filtered.length > 1 ? 's' : ''} sur ${rawData.length}`;
    }
  }

  resetAllFilters() {
    this.searchTerm = '';
    this.selectedCategories.clear();
    this.selectedArrondissement = 0;
    this.nightFocus = false;

    // Reset UI
    const searchInput = this.container.querySelector('#search-input');
    if (searchInput) searchInput.value = '';

    const clearBtn = this.container.querySelector('#search-clear-btn');
    if (clearBtn) clearBtn.classList.add('is-hidden');

    const select = this.container.querySelector('#arrondissement-select');
    if (select) select.value = '0';

    const catBtns = this.container.querySelectorAll('.category-tag-btn');
    catBtns.forEach((btn) => {
      btn.classList.remove('is-active');
      btn.setAttribute('aria-pressed', 'false');
    });

    const nightBtn = this.container.querySelector('#night-focus-btn');
    if (nightBtn) {
      nightBtn.classList.remove('is-active');
      nightBtn.setAttribute('aria-pressed', 'false');
    }

    appState.toggleNightFocus(false);
    this.onFilterChange();
  }
}
