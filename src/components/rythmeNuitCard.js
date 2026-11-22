/**
 * Composant Le Rythme de la Nuit (Activité Nocturne F6)
 * Conforme au design « Le rythme de la nuit »
 */

import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export class RythmeNuitCardComponent {
  constructor(containerId = 'rythme-card') {
    this.container = document.getElementById(containerId);
    this.chart = null;
    this.init();
  }

  init() {
    if (!this.container) return;
    this.render();
    this.initChart();
  }

  render() {
    this.container.innerHTML = `
      <div class="rythme-header">
        <div class="rythme-title-area">
          <span class="rythme-tag">ACTIVITÉ NOCTURNE</span>
          <h2 class="rythme-title">Le rythme de la nuit</h2>
          <div class="rythme-badge">+18% de fréquentation entre 21h et 02h</div>
        </div>

        <select class="rythme-select" aria-label="Plage temporelle">
          <option value="24h">24h ⌵</option>
          <option value="7j">7 jours</option>
        </select>
      </div>

      <div class="rythme-canvas-wrap">
        <canvas id="canvas-rythme-curve"></canvas>
      </div>

      <div class="rythme-footer-legend">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span class="legend-line-lime"></span>
          <span>Nuit estimé</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span class="legend-line-cyan"></span>
          <span>Capacité</span>
        </div>
      </div>
    `;
  }

  initChart() {
    const canvas = document.getElementById('canvas-rythme-curve');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(212, 255, 50, 0.28)');
    gradient.addColorStop(0.6, 'rgba(212, 255, 50, 0.08)');
    gradient.addColorStop(1, 'rgba(212, 255, 50, 0.0)');

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: ['18h', '20h', '21h', '22h', '23h', '00h', '01h', '02h', '03h', '04h', '06h'],
        datasets: [
          {
            label: 'Nuit estimé',
            data: [25, 45, 75, 110, 132, 124, 98, 70, 48, 32, 18],
            borderColor: '#D4FF32',
            borderWidth: 2.5,
            fill: true,
            backgroundColor: gradient,
            tension: 0.45,
            pointRadius: (ctx) => (ctx.dataIndex === 4 ? 6 : 0), // Point lumineux à 23h
            pointBackgroundColor: '#D4FF32',
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 2,
            pointHoverRadius: 8
          },
          {
            label: 'Capacité',
            data: [140, 140, 140, 140, 140, 140, 140, 140, 140, 140, 140],
            borderColor: 'rgba(0, 240, 255, 0.25)',
            borderWidth: 1.5,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(13, 20, 36, 0.95)',
            borderColor: 'rgba(212, 255, 50, 0.4)',
            borderWidth: 1,
            titleColor: '#FFFFFF',
            bodyColor: '#D4FF32',
            padding: 10,
            displayColors: false,
            callbacks: {
              title: (items) => `${items[0].label} : Pic d'activité nocturne`,
              label: (item) => ` ${item.parsed.y}+ personnes orientées ou hébergées`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#8E9BB0',
              font: { size: 11, family: 'Inter' }
            }
          },
          y: {
            display: false,
            min: 0,
            max: 160
          }
        }
      }
    });
  }
}
