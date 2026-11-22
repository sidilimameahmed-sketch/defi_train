/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { eventBus } from '../src/core/eventBus.js';
import { appState } from '../src/core/state.js';
import { EVENTS } from '../src/core/constants.js';
import { BottomSheetComponent } from '../src/components/bottomSheet.js';
import { EasterEggComponent } from '../src/components/easterEgg.js';

describe('Phase 6 - BottomSheetComponent (F4)', () => {
  let container;
  let bottomSheet;

  beforeEach(() => {
    document.body.innerHTML = '<aside id="bottom-sheet" class="is-hidden"></aside>';
    container = document.getElementById('bottom-sheet');
    bottomSheet = new BottomSheetComponent('bottom-sheet');
  });

  const sampleCenter = {
    id: 'heb_14_1',
    name: 'CHU René Coty',
    category: 'CHU',
    categoryLabel: "Centre d'Hébergement d'Urgence",
    address: '24 Boulevard René Coty, 75014 Paris',
    arrondissement: 14,
    phone: '01 43 27 12 34',
    capacity: 75,
    isNightActive: true,
    publicTarget: 'Hommes isolés',
    hoursDescription: '24h/24 — 7j/7',
    nightDescription: "Accueil d'urgence ouvert en permanence la nuit (24h/24)."
  };

  it('ouvre la fiche détaillée et affiche les informations correctes lors de la sélection', () => {
    bottomSheet.open(sampleCenter);

    expect(container.classList.contains('is-visible')).toBe(true);
    expect(container.textContent).toContain('CHU René Coty');
    expect(container.textContent).toContain('75 lits');
    expect(container.textContent).toContain('01 43 27 12 34');
    expect(container.textContent).toContain('Paris 14e arrondissement');
  });

  it('ferme la fiche détaillée lors de la fermeture', () => {
    bottomSheet.open(sampleCenter);
    expect(container.classList.contains('is-visible')).toBe(true);

    bottomSheet.close();
    expect(container.classList.contains('is-visible')).toBe(false);
  });

  it('réagit automatiquement à l’événement CENTER_SELECTED émis par le bus', () => {
    eventBus.emit(EVENTS.CENTER_SELECTED, { center: sampleCenter, origin: 'map_marker' });
    expect(container.classList.contains('is-visible')).toBe(true);
    expect(container.textContent).toContain('CHU René Coty');
  });
});

describe('Phase 7 - EasterEggComponent (F8)', () => {
  let canvas;
  let easterEgg;

  beforeEach(() => {
    document.body.innerHTML = '<canvas id="easter-egg-canvas"></canvas>';
    canvas = document.getElementById('easter-egg-canvas');
    // Mock getContext pour jsdom
    canvas.getContext = vi.fn(() => ({
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn()
      }))
    }));
    easterEgg = new EasterEggComponent('easter-egg-canvas');
  });

  it('se déclenche via l’événement applicatif EASTER_EGG_TRIGGERED', () => {
    expect(easterEgg.isActive).toBe(false);

    eventBus.emit(EVENTS.EASTER_EGG_TRIGGERED, {});
    expect(easterEgg.isActive).toBe(true);
    expect(canvas.classList.contains('active')).toBe(true);

    easterEgg.stop();
    expect(easterEgg.isActive).toBe(false);
  });

  it('détecte la saisie clavier séquentielle du mot secret "lune"', () => {
    expect(easterEgg.isActive).toBe(false);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'l' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'u' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));

    expect(easterEgg.isActive).toBe(true);
    easterEgg.stop();
  });
});
