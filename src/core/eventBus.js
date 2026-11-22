/**
 * Event Bus Pub/Sub découplé
 * Permet la communication réactive entre modules sans couplage fort
 */

class EventBus {
  constructor() {
    this.listeners = new Map();
    this.debug = false;
  }

  setDebug(enabled) {
    this.debug = Boolean(enabled);
  }

  /**
   * S'abonne à un événement
   * @param {string} event Nom de l'événement
   * @param {Function} handler Callback
   * @returns {Function} Fonction de désabonnement
   */
  on(event, handler) {
    if (typeof handler !== 'function') {
      throw new TypeError(`Handler for event "${event}" must be a function`);
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event).add(handler);

    // Retourne une fonction de désabonnement pratique
    return () => this.off(event, handler);
  }

  /**
   * Se désabonne d'un événement
   * @param {string} event Nom de l'événement
   * @param {Function} handler Callback
   */
  off(event, handler) {
    if (!this.listeners.has(event)) return;
    const handlers = this.listeners.get(event);
    handlers.delete(handler);
    if (handlers.size === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * S'abonne pour une exécution unique
   * @param {string} event 
   * @param {Function} handler 
   */
  once(event, handler) {
    const wrapped = (payload) => {
      this.off(event, wrapped);
      handler(payload);
    };
    return this.on(event, wrapped);
  }

  /**
   * Émet un événement avec une charge utile
   * @param {string} event Nom de l'événement
   * @param {any} payload Données associées
   */
  emit(event, payload) {
    if (this.debug) {
      console.log(`[EventBus] 🌙 Emit "${event}"`, payload);
    }

    if (!this.listeners.has(event)) return;

    // Copie de l'ensemble pour éviter les mutations pendant l'itération
    const handlers = Array.from(this.listeners.get(event));
    for (const handler of handlers) {
      try {
        handler(payload);
      } catch (err) {
        console.error(`[EventBus] Erreur dans le handler pour "${event}":`, err);
      }
    }
  }

  /**
   * Supprime tous les écouteurs
   */
  clear() {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
