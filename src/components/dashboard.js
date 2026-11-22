/**
 * Composant Tableau de Bord Statistique Supérieur (F2)
 * Projet: Visualisez l'OpenData au clair de lune
 */

import { eventBus } from '../core/eventBus.js';
import { appState } from '../core/state.js';
import { EVENTS } from '../core/constants.js';
import { computeDashboardKPIs } from '../services/kpiService.js';
import { LiveCounter } from './liveCounter.js';

export class DashboardComponent {
  constructor(containerId = 'dashboard') {
    this.container = document.getElementById(containerId);
    this.counterStructures = null;
    this.counterBeds = null;
    this.counterCoverage = null;
    this.init();
  }

  init() {
    if (!this.container) {
      console.warn('[Dashboard] Conteneur non trouvé');
      return;
    }

    this.render();
    this.setupCounters();
    this.listenToEvents();
  }

  render() {
    this.container.innerHTML = `
      <!-- Carte 1 : Total Structures -->
      <div class="kpi-card" id="kpi-structures">
        <div class="kpi-icon-wrap" style="background: rgba(0, 240, 255, 0.12); color: var(--neon-ssp); border: 1px solid rgba(0, 240, 255, 0.3);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 21h18M3 7v14M21 7v14M6 7V3h12v4M9 11h2M9 15h2M13 11h2M13 15h2"></path>
          </svg>
        </div>
        <div class="kpi-body">
          <div class="kpi-value font-mono" id="kpi-val-structures">0</div>
          <div class="kpi-label">Total Structures</div>
          <div class="kpi-subtext" id="kpi-sub-structures">À l'écoute de Paris...</div>
        </div>
      </div>

      <!-- Carte 2 : Capacité en Lits (Compteur Dynamique F7) -->
      <div class="kpi-card" id="kpi-beds">
        <div class="kpi-icon-wrap animate-heartbeat" style="background: rgba(255, 230, 0, 0.12); color: var(--neon-chrs); border: 1px solid rgba(255, 230, 0, 0.3);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"></path>
          </svg>
        </div>
        <div class="kpi-body">
          <div class="kpi-value font-mono glow-text-chu" id="kpi-val-beds">0</div>
          <div class="kpi-label">Capacité en Lits</div>
          <div class="kpi-subtext" id="kpi-sub-beds">0 centres d'hébergement</div>
        </div>
      </div>

      <!-- Carte 3 : Taux Couverture Nuit -->
      <div class="kpi-card" id="kpi-coverage">
        <div class="kpi-icon-wrap" style="background: rgba(57, 255, 20, 0.12); color: var(--neon-chu); border: 1px solid rgba(57, 255, 20, 0.3);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </div>
        <div class="kpi-body">
          <div class="kpi-value font-mono" id="kpi-val-coverage">0%</div>
          <div class="kpi-label">Couverture Nuit</div>
          <div class="kpi-subtext" id="kpi-sub-coverage">0 centres ouverts la nuit</div>
        </div>
      </div>
    `;

    // Injection de styles spécifiques pour les KPI cards
    const style = document.createElement('style');
    style.textContent = `
      .kpi-icon-wrap {
        width: 44px;
        height: 44px;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .kpi-body {
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .kpi-value {
        font-size: 1.4rem;
        font-weight: 700;
        line-height: 1.1;
        color: var(--text-primary);
      }
      .kpi-label {
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--text-muted);
        margin-top: 2px;
      }
      .kpi-subtext {
        font-size: 0.7rem;
        color: var(--text-faint);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `;
    document.head.appendChild(style);
  }

  setupCounters() {
    this.counterStructures = new LiveCounter('#kpi-val-structures', { duration: 900 });
    this.counterBeds = new LiveCounter('#kpi-val-beds', { duration: 1300 });
  }

  listenToEvents() {
    const updateDashboard = () => {
      const { filteredData } = appState.getState();
      const kpis = computeDashboardKPIs(filteredData);
      this.updateDisplay(kpis);
    };

    eventBus.on(EVENTS.DATA_LOADED, updateDashboard);
    eventBus.on(EVENTS.FILTER_CHANGED, updateDashboard);
  }

  /**
   * Met à jour les éléments visuels avec les calculs récents
   * @param {Object} kpis KPIDashboardData
   */
  updateDisplay(kpis) {
    if (!kpis) return;

    // Mise à jour Compteurs animés
    if (this.counterStructures) {
      this.counterStructures.update(kpis.totalCenters.value);
    }
    if (this.counterBeds) {
      this.counterBeds.update(kpis.totalBeds.value);
    }

    // Carte 1 : Subtext
    const subStructures = document.getElementById('kpi-sub-structures');
    if (subStructures) {
      subStructures.textContent = kpis.totalCenters.trend;
    }

    // Carte 2 : Subtext
    const subBeds = document.getElementById('kpi-sub-beds');
    if (subBeds) {
      const active = kpis.totalBeds.activeCentersCount;
      subBeds.textContent = `${active} centre${active > 1 ? 's' : ''} d'hébergement`;
    }

    // Carte 3 : Couverture nuit
    const valCoverage = document.getElementById('kpi-val-coverage');
    if (valCoverage) {
      valCoverage.textContent = `${kpis.nightCoverage.ratePercentage}%`;
    }
    const subCoverage = document.getElementById('kpi-sub-coverage');
    if (subCoverage) {
      const activeNight = kpis.nightCoverage.activeNightCenters;
      subCoverage.textContent = `${activeNight} structure${activeNight > 1 ? 's' : ''} 24h/24 ou nuit`;
    }
  }
}
