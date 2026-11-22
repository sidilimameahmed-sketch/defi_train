/**
 * Store Réactif d'État Applicatif (AppState)
 * Projet: Visualisez l'OpenData au clair de lune
 */

import { eventBus } from './eventBus.js';
import { EVENTS } from './constants.js';

class AppState {
  constructor() {
    this.state = {
      rawData: [],
      filteredData: [],
      activeFilters: {
        searchTerm: '',
        categories: [], // vide = toutes
        arrondissements: [], // vide = tous
        nightFocusOnly: false
      },
      selectedCenter: null,
      nightFocusMode: false,
      metrics: {
        totalCenters: 0,
        totalBeds: 0,
        nightCoverageRate: 0
      },
      loadingState: 'idle', // 'idle' | 'loading' | 'success' | 'error'
      errorState: null,
      dataSource: 'none' // 'live_api' | 'local_fallback' | 'none'
    };

    this.subscribers = new Set();
  }

  /**
   * Retourne une copie en lecture seule de l'état
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Met à jour une partie de l'état et notifie les observateurs
   * @param {Partial<AppState>} partial
   */
  setState(partial) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...partial };
    this._notify(this.state, prevState);
  }

  /**
   * Initialise les données brutes
   * @param {Array} centers
   * @param {'live_api' | 'local_fallback'} source
   */
  setData(centers, source = 'live_api') {
    this.setState({
      rawData: centers,
      filteredData: centers,
      loadingState: 'success',
      dataSource: source,
      errorState: null
    });
    eventBus.emit(EVENTS.DATA_LOADED, { centers, meta: { source, timestamp: new Date().toISOString() } });
  }

  /**
   * Met à jour les résultats filtrés
   * @param {Array} filteredCenters
   * @param {Object} criteria
   */
  setFilteredData(filteredCenters, criteria) {
    this.setState({
      filteredData: filteredCenters,
      activeFilters: { ...this.state.activeFilters, ...criteria }
    });
    eventBus.emit(EVENTS.FILTER_CHANGED, {
      criteria: this.state.activeFilters,
      resultCount: filteredCenters.length
    });
  }

  /**
   * Sélectionne un centre pour affichage détaillé
   * @param {Object|null} center
   * @param {string} origin
   */
  selectCenter(center, origin = 'map_marker') {
    this.setState({ selectedCenter: center });
    if (center) {
      eventBus.emit(EVENTS.CENTER_SELECTED, { center, origin });
    } else {
      eventBus.emit(EVENTS.CENTER_DESELECTED, {});
    }
  }

  /**
   * Bascule le mode Focus Nuit (F5)
   * @param {boolean} [forceState]
   */
  toggleNightFocus(forceState) {
    const newState = typeof forceState === 'boolean' ? forceState : !this.state.nightFocusMode;
    this.setState({
      nightFocusMode: newState,
      activeFilters: {
        ...this.state.activeFilters,
        nightFocusOnly: newState
      }
    });
    eventBus.emit(EVENTS.FOCUS_TOGGLED, { isEnabled: newState });
    return newState;
  }

  /**
   * Définit l'état de chargement
   * @param {'idle' | 'loading' | 'success' | 'error'} loadingState 
   */
  setLoading(loadingState) {
    this.setState({ loadingState });
    if (loadingState === 'loading') {
      eventBus.emit(EVENTS.DATA_LOADING, {});
    }
  }

  /**
   * Définit une erreur
   * @param {{ code: string, message: string }} error 
   */
  setError(error) {
    this.setState({
      loadingState: 'error',
      errorState: error
    });
    eventBus.emit(EVENTS.DATA_ERROR, error);
  }

  /**
   * S'abonne aux changements d'état
   * @param {Function} callback (newState, prevState) => void
   * @returns {Function} désabonnement
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  _notify(newState, prevState) {
    for (const callback of this.subscribers) {
      try {
        callback(newState, prevState);
      } catch (err) {
        console.error('[AppState] Erreur dans subscriber:', err);
      }
    }
  }
}

export const appState = new AppState();
