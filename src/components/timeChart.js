/**
 * Composant Visualisations Graphiques Temporelles & Spatiales (F6)
 * Projet: Visualisez l'OpenData au clair de lune
 * Intégration Chart.js en mode sombre haute visibilité
 */

import { Chart, registerables } from 'chart.js';
import { appState } from '../core/state.js';
import { computeDashboardKPIs } from '../services/kpiService.js';
import { CATEGORIES } from '../core/constants.js';

// Enregistrement des composants Chart.js
Chart.register(...registerables);

export class TimeChartComponent {
  constructor(containerId = 'chart-panel') {
    this.container = document.getElementById(containerId);
    this.barChart = null;
    this.doughnutChart = null;
    this.isOpen = false;
    this.init();
  }

  init() {
    if (!this.container) {
      console.warn('[TimeChart] Conteneur non trouvé');
      return;
    }

    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="chart-modal-header">
        <div class="chart-modal-titles">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.3rem;">📊</span>
            <h2 class="chart-modal-title">Visualisations Analytiques Nocturnes</h2>
          </div>
          <div class="chart-modal-subtitle">Distribution de la capacité d'accueil et des structures de solidarité à Paris</div>
        </div>
        <button id="chart-panel-close-btn" class="chart-close-btn" title="Fermer le volet" aria-label="Fermer">✕</button>
      </div>

      <div class="chart-modal-body">
        <!-- Graphique 1 : Histogramme par Arrondissement -->
        <div class="chart-card">
          <div class="chart-card-header">
            <h3 class="chart-card-title">Capacité en Lits par Arrondissement</h3>
            <span class="badge badge-chu">Places d'hébergement</span>
          </div>
          <div class="chart-canvas-wrap">
            <canvas id="canvas-beds-arrondissement"></canvas>
          </div>
        </div>

        <!-- Graphique 2 : Anneau Typologies & Jour/Nuit -->
        <div class="chart-card">
          <div class="chart-card-header">
            <h3 class="chart-card-title">Répartition par Typologie</h3>
            <span class="badge badge-night">Couverture</span>
          </div>
          <div class="chart-canvas-wrap" style="max-height: 280px; display: flex; justify-content: center;">
            <canvas id="canvas-category-doughnut"></canvas>
          </div>
        </div>
      </div>
    `;

    this.injectStyles();
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .chart-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .chart-modal-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-primary);
      }
      .chart-modal-subtitle {
        font-size: 0.78rem;
        color: var(--text-muted);
        margin-top: 2px;
      }
      .chart-close-btn {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.06);
        color: var(--text-muted);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
        transition: all var(--transition-fast);
      }
      .chart-close-btn:hover {
        background: rgba(255, 255, 255, 0.15);
        color: var(--text-primary);
      }
      .chart-modal-body {
        padding: 1.25rem 1.5rem;
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.25rem;
        overflow-y: auto;
      }
      @media (min-width: 768px) {
        .chart-modal-body {
          grid-template-columns: 3fr 2fr;
        }
      }
      .chart-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: var(--radius-md);
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .chart-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .chart-card-title {
        font-size: 0.92rem;
        font-weight: 600;
        color: var(--text-secondary);
      }
      .chart-canvas-wrap {
        position: relative;
        width: 100%;
        height: 260px;
      }
    `;
    document.head.appendChild(style);
  }

  bindEvents() {
    const closeBtn = this.container.querySelector('#chart-panel-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.close();
      });
    }

    // Touche Échap
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    this.container.classList.add('is-open');
    this.container.setAttribute('aria-hidden', 'false');
    this.renderCharts();
  }

  close() {
    this.isOpen = false;
    this.container.classList.remove('is-open');
    this.container.setAttribute('aria-hidden', 'true');
  }

  renderCharts() {
    const { filteredData } = appState.getState();
    const kpis = computeDashboardKPIs(filteredData);

    this.renderBarChart(kpis.capacityByArrondissement);
    this.renderDoughnutChart(kpis.categoryDistribution);
  }

  renderBarChart(arrData) {
    const canvas = document.getElementById('canvas-beds-arrondissement');
    if (!canvas) return;

    if (this.barChart) {
      this.barChart.destroy();
    }

    const labels = arrData.map((d) => `${d.arrondissement}e`);
    const data = arrData.map((d) => d.bedCount);

    this.barChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Lits disponibles',
            data,
            backgroundColor: 'rgba(0, 240, 255, 0.45)',
            borderColor: '#00F0FF',
            borderWidth: 1.5,
            borderRadius: 4,
            hoverBackgroundColor: 'rgba(57, 255, 20, 0.75)',
            hoverBorderColor: '#39FF14'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#FFFFFF',
            bodyColor: '#E2E8F0',
            borderColor: 'rgba(255, 255, 255, 0.15)',
            borderWidth: 1,
            padding: 10,
            displayColors: false,
            callbacks: {
              label: (item) => `🛏️ ${item.parsed.y} lits d'hébergement`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#94A3B8', font: { size: 10 } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: { color: '#94A3B8', font: { size: 10 } },
            beginAtZero: true
          }
        }
      }
    });
  }

  renderDoughnutChart(catData) {
    const canvas = document.getElementById('canvas-category-doughnut');
    if (!canvas) return;

    if (this.doughnutChart) {
      this.doughnutChart.destroy();
    }

    const labels = catData.map((d) => d.label);
    const data = catData.map((d) => d.count);
    const backgroundColors = catData.map((d) => d.color);

    this.doughnutChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: backgroundColors,
            borderColor: '#070A13',
            borderWidth: 2,
            hoverOffset: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#CBD5E1',
              font: { size: 11 },
              padding: 12,
              usePointStyle: true
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#FFFFFF',
            bodyColor: '#E2E8F0',
            borderColor: 'rgba(255, 255, 255, 0.15)',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (item) => ` ${item.label} : ${item.parsed} établissement${item.parsed > 1 ? 's' : ''}`
            }
          }
        },
        cutout: '65%'
      }
    });
  }
}
