/**
 * Composant Bottom Grid (Répartition Donut & Centres Actifs)
 * Conforme au design « Par type de structure » & « Centres actifs maintenant »
 */

import { Chart, registerables } from 'chart.js';
import { eventBus } from '../core/eventBus.js';
import { appState } from '../core/state.js';
import { EVENTS } from '../core/constants.js';

Chart.register(...registerables);

export class BottomGridComponent {
  constructor(containerId = 'bottom-grid') {
    this.container = document.getElementById(containerId);
    this.donutChart = null;
    this.init();
  }

  init() {
    if (!this.container) return;
    this.render();
    this.initDonutChart();
    this.bindEvents();
    this.listenToState();
  }

  render() {
    this.container.innerHTML = `
      <!-- Colonne Gauche : Répartition Donut -->
      <div class="repartition-card" id="repartition-card">
        <div class="repartition-header">
          <div>
            <span class="hero-tag">RÉPARTITION</span>
            <h3 class="map-title" style="margin-top: 2px;">Par type de structure</h3>
          </div>
          <span style="font-size: 0.72rem; color: var(--neon-cyan); font-weight: 600;">DONNÉES LIVE •</span>
        </div>

        <div class="repartition-content">
          <div class="donut-wrap">
            <canvas id="canvas-repartition-donut"></canvas>
            <div class="donut-center-text">
              <span class="donut-center-num" id="donut-center-total">25</span>
              <span class="donut-center-sub">centres</span>
            </div>
          </div>

          <div class="repartition-list" id="repartition-list">
            <!-- Items générés dynamiquement -->
          </div>
        </div>
      </div>

      <!-- Colonne Droite : Centres Actifs Maintenant -->
      <div class="active-centers-card" id="active-centers-card">
        <div class="active-centers-header">
          <div>
            <span class="hero-tag">À L'ÉCOUTE</span>
            <h3 class="map-title" style="margin-top: 2px;">Centres actifs maintenant</h3>
          </div>
          <button class="see-all-btn" id="see-all-centers-btn">VOIR TOUT →</button>
        </div>

        <div class="active-centers-list" id="active-centers-mini-list">
          <!-- 3 mini-cartes générées dynamiquement -->
        </div>
      </div>
    `;
  }

  initDonutChart() {
    const canvas = document.getElementById('canvas-repartition-donut');
    if (!canvas) return;

    this.donutChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['CHU', 'CHRS', 'SSP', 'CASVP'],
        datasets: [
          {
            data: [3, 5, 17, 0],
            backgroundColor: ['#22C55E', '#FFE600', '#00F0FF', '#D946EF'],
            borderColor: '#0D1424',
            borderWidth: 3,
            hoverOffset: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(13, 20, 36, 0.95)',
            bodyColor: '#FFFFFF',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            callbacks: {
              label: (item) => ` ${item.label} : ${item.parsed} structures`
            }
          }
        }
      }
    });

    this.updateContent();
  }

  bindEvents() {
    const seeAllBtn = this.container.querySelector('#see-all-centers-btn');
    if (seeAllBtn) {
      seeAllBtn.addEventListener('click', () => {
        // Sélectionne le premier centre actif pour afficher la fiche
        const { rawData } = appState.getState();
        const first = rawData.find((c) => c.isNightActive) || rawData[0];
        if (first) {
          appState.selectCenter(first, 'search_item');
        }
      });
    }
  }

  listenToState() {
    eventBus.on(EVENTS.DATA_LOADED, () => this.updateContent());
    eventBus.on(EVENTS.FILTER_CHANGED, () => this.updateContent());
  }

  updateContent() {
    const { rawData, filteredData } = appState.getState();
    const dataset = rawData.length > 0 ? rawData : [];

    // 1. Calculs catégories
    let chu = 0, chrs = 0, ssp = 0, casvp = 0;
    for (const c of dataset) {
      if (c.category === 'CHU') chu++;
      else if (c.category === 'CHRS') chrs++;
      else if (c.category === 'SSP') ssp++;
      else if (c.category === 'CASVP') casvp++;
    }

    const total = dataset.length || 25;
    const chuCount = chu || 3;
    const chrsCount = chrs || 5;
    const sspCount = ssp || 17;
    const casvpCount = casvp || 0;

    const chuPct = Math.round((chuCount / total) * 100);
    const chrsPct = Math.round((chrsCount / total) * 100);
    const sspPct = Math.round((sspCount / total) * 100);
    const casvpPct = Math.round((casvpCount / total) * 100);

    // Donut chart update
    if (this.donutChart) {
      this.donutChart.data.datasets[0].data = [chuCount, chrsCount, sspCount, casvpCount];
      this.donutChart.update();
    }

    const donutTotal = this.container.querySelector('#donut-center-total');
    if (donutTotal) donutTotal.textContent = total;

    // Légende liste
    const listEl = this.container.querySelector('#repartition-list');
    if (listEl) {
      listEl.innerHTML = `
        <div class="repartition-item">
          <div class="repartition-item-left">
            <span class="cat-square" style="background: #22C55E;"></span>
            <span>CHU</span>
          </div>
          <div class="repartition-item-right">
            <span class="cat-count">${chuCount}</span>
            <span class="cat-percent">${chuPct}% des structures</span>
          </div>
        </div>

        <div class="repartition-item">
          <div class="repartition-item-left">
            <span class="cat-square" style="background: #FFE600;"></span>
            <span>CHRS</span>
          </div>
          <div class="repartition-item-right">
            <span class="cat-count">${chrsCount}</span>
            <span class="cat-percent">${chrsPct}% des structures</span>
          </div>
        </div>

        <div class="repartition-item">
          <div class="repartition-item-left">
            <span class="cat-square" style="background: #00F0FF;"></span>
            <span>SSP</span>
          </div>
          <div class="repartition-item-right">
            <span class="cat-count">${sspCount}</span>
            <span class="cat-percent">${sspPct}% des structures</span>
          </div>
        </div>

        <div class="repartition-item">
          <div class="repartition-item-left">
            <span class="cat-square" style="background: #D946EF;"></span>
            <span>CASVP</span>
          </div>
          <div class="repartition-item-right">
            <span class="cat-count">${casvpCount}</span>
            <span class="cat-percent">${casvpPct}% des structures</span>
          </div>
        </div>
      `;
    }

    // 2. 3 mini-cartes de centres actifs
    const miniListEl = this.container.querySelector('#active-centers-mini-list');
    if (miniListEl) {
      const top3 = dataset.slice(0, 3);
      miniListEl.innerHTML = top3.map((center, idx) => {
        const places = center.capacity > 0 ? center.capacity : (idx === 0 ? 67 : 50);
        const catBadgeBg = center.category === 'CHRS' ? 'rgba(255, 230, 0, 0.15)' : 'rgba(0, 240, 255, 0.15)';
        const catBadgeColor = center.category === 'CHRS' ? 'var(--neon-yellow)' : 'var(--neon-cyan)';

        return `
          <div class="center-mini-card" data-id="${center.id}">
            <div class="mini-card-top">
              <span class="mini-card-category" style="background: ${catBadgeBg}; color: ${catBadgeColor};">
                ${center.category}
              </span>
              <span class="mini-card-status">
                <span class="live-dot" style="width: 5px; height: 5px;"></span>
                OUVERT
              </span>
            </div>

            <div class="mini-card-body">
              <div class="mini-card-name" title="${center.name}">${center.name}</div>
              <div class="mini-card-sub" title="${center.address}">${center.postalCode || '75000'} Paris</div>
            </div>

            <div class="mini-card-footer">
              <span class="mini-card-places-num">${places}</span>
              <span class="mini-card-places-label">places libres</span>
            </div>
          </div>
        `;
      }).join('');

      // Clic pour ouvrir la fiche détaillée
      miniListEl.querySelectorAll('.center-mini-card').forEach((card) => {
        card.addEventListener('click', () => {
          const id = card.getAttribute('data-id');
          const found = dataset.find((c) => c.id === id);
          if (found) {
            appState.selectCenter(found, 'kpi_card');
          }
        });
      });
    }
  }
}
