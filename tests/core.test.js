import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventBus } from '../src/core/eventBus.js';
import { appState } from '../src/core/state.js';
import { CATEGORIES, EVENTS, ARRONDISSEMENTS } from '../src/core/constants.js';
import { API_CONFIG } from '../src/config/api.config.js';
import { MAP_CONFIG } from '../src/config/map.config.js';

describe('Phase 1 - Configurations & Constantes', () => {
  it('définit les 4 catégories obligatoires avec leurs couleurs néon respectives', () => {
    expect(CATEGORIES).toHaveProperty('CHU');
    expect(CATEGORIES).toHaveProperty('CHRS');
    expect(CATEGORIES).toHaveProperty('SSP');
    expect(CATEGORIES).toHaveProperty('CASVP');

    expect(CATEGORIES.CHU.color).toBe('#39FF14'); // Vert Néon
    expect(CATEGORIES.CHRS.color).toBe('#FFE600'); // Jaune Néon
    expect(CATEGORIES.SSP.color).toBe('#00F0FF'); // Cyan Électrique
    expect(CATEGORIES.CASVP.color).toBe('#D946EF'); // Magenta Néon
  });

  it('fournit les 20 arrondissements parisiens', () => {
    expect(ARRONDISSEMENTS).toHaveLength(20);
    expect(ARRONDISSEMENTS[0]).toBe(1);
    expect(ARRONDISSEMENTS[19]).toBe(20);
  });

  it('configure les endpoints Explore v2.1 de Paris et les fallbacks', () => {
    expect(API_CONFIG.TIMEOUT_MS).toBe(6000);
    expect(API_CONFIG.ENDPOINTS.SSP_CASVP.URL).toContain('coordonnees-ssp-et-casvp');
    expect(API_CONFIG.ENDPOINTS.SSP_CASVP.FALLBACK).toContain('coordonnees-ssp-et-casvp.fallback.geojson');
    expect(API_CONFIG.ENDPOINTS.HEBERGEMENTS.URL).toContain('hebergements-casvp');
    expect(API_CONFIG.ENDPOINTS.HEBERGEMENTS.FALLBACK).toContain('hebergements-casvp.fallback.geojson');
  });

  it('configure le moteur cartographique pour Paris et tuiles sombres', () => {
    expect(MAP_CONFIG.DEFAULT_CENTER).toEqual([48.8566, 2.3522]);
    expect(MAP_CONFIG.DEFAULT_ZOOM).toBe(12);
    expect(MAP_CONFIG.TILES.URL).toContain('tile.openstreetmap.org');
  });
});

describe('Phase 1 - EventBus', () => {
  beforeEach(() => {
    eventBus.clear();
  });

  it('permet de souscrire, émettre et recevoir des événements', () => {
    const handler = vi.fn();
    eventBus.on(EVENTS.DATA_LOADED, handler);

    const payload = { centers: [{ id: 'test-1' }], meta: { source: 'live_api' } };
    eventBus.emit(EVENTS.DATA_LOADED, payload);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(payload);
  });

  it('permet de se désabonner via la fonction retournée', () => {
    const handler = vi.fn();
    const unsubscribe = eventBus.on('test:event', handler);

    eventBus.emit('test:event', { ok: 1 });
    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();
    eventBus.emit('test:event', { ok: 2 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('gère les écouteurs once', () => {
    const handler = vi.fn();
    eventBus.once('single:event', handler);

    eventBus.emit('single:event', 'valeur 1');
    eventBus.emit('single:event', 'valeur 2');

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('valeur 1');
  });
});

describe('Phase 1 - AppState', () => {
  it('initialise avec un état par défaut cohérent', () => {
    const state = appState.getState();
    expect(state.rawData).toEqual([]);
    expect(state.filteredData).toEqual([]);
    expect(state.nightFocusMode).toBe(false);
    expect(state.loadingState).toBe('idle');
  });

  it('permet de basculer le mode Focus Nuit', () => {
    expect(appState.getState().nightFocusMode).toBe(false);
    appState.toggleNightFocus(true);
    expect(appState.getState().nightFocusMode).toBe(true);
    expect(appState.getState().activeFilters.nightFocusOnly).toBe(true);

    appState.toggleNightFocus(false);
    expect(appState.getState().nightFocusMode).toBe(false);
    expect(appState.getState().activeFilters.nightFocusOnly).toBe(false);
  });

  it('notifie les abonnés lors des mutations', () => {
    const subscriber = vi.fn();
    const unsub = appState.subscribe(subscriber);

    appState.setState({ loadingState: 'loading' });
    expect(subscriber).toHaveBeenCalled();

    unsub();
  });
});
