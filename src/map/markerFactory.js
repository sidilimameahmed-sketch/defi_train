/**
 * Fabrique de Marqueurs Lumineux Leaflet (Neon Marker Factory)
 * Projet: Visualisez l'OpenData au clair de lune
 * Fonctionnalité F1 — Carte Nocturne Interactive
 */

import L from 'leaflet';
import { appState } from '../core/state.js';
import { CATEGORIES } from '../core/constants.js';

/**
 * Génère le contenu HTML de l'infobulle sombre (Tooltip)
 * @param {Object} center CenterEntity
 * @returns {string}
 */
function createTooltipHTML(center) {
  const cat = CATEGORIES[center.category] || CATEGORIES.CHU;
  const nightBadge = center.isNightActive
    ? `<span class="badge badge-night">🌙 Actif de nuit</span>`
    : `<span class="badge" style="background: rgba(255,255,255,0.06); color: var(--text-muted);">Diurne</span>`;

  const capacityInfo = center.capacity > 0
    ? `<div style="font-size: 0.75rem; color: var(--neon-chrs); margin-top: 2px;">🛏️ ${center.capacity} lits disponibles</div>`
    : '';

  return `
    <div style="display: flex; flex-direction: column; gap: 4px; min-width: 160px; max-width: 240px;">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
        <span class="badge badge-${center.category.toLowerCase()}">${center.category}</span>
        ${nightBadge}
      </div>
      <div style="font-weight: 600; font-size: 0.85rem; color: #FFFFFF; line-height: 1.2; margin-top: 2px;">
        ${center.name}
      </div>
      <div style="font-size: 0.72rem; color: var(--text-muted);">
        ${center.address}
      </div>
      ${capacityInfo}
    </div>
  `;
}

/**
 * Crée une instance de marqueur Leaflet stylisée avec halo néon
 * @param {Object} center CenterEntity
 * @param {Function} [onSelectCallback]
 * @returns {L.Marker}
 */
export function createNeonMarker(center, onSelectCallback) {
  const categoryKey = (center.category || 'CHU').toLowerCase();
  const isNight = center.isNightActive ? 'night-active' : '';

  const icon = L.divIcon({
    className: 'leaflet-neon-wrapper',
    html: `
      <div class="neon-marker ${categoryKey} ${isNight}" data-id="${center.id}">
        <div class="neon-marker-inner"></div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    tooltipAnchor: [0, -14]
  });

  const marker = L.marker([center.coordinates.lat, center.coordinates.lng], {
    icon,
    title: center.name,
    riseOnHover: true
  });

  // Infobulle au survol
  marker.bindTooltip(createTooltipHTML(center), {
    className: 'leaflet-tooltip-dark',
    direction: 'top',
    offset: [0, -12],
    opacity: 1
  });

  // Événement clic
  marker.on('click', (e) => {
    L.DomEvent.stopPropagation(e);
    appState.selectCenter(center, 'map_marker');
    if (typeof onSelectCallback === 'function') {
      onSelectCallback(center);
    }
  });

  return marker;
}
