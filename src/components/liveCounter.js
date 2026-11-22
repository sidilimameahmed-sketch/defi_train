/**
 * Composant Compteur Numérique Dynamique & Battement Lumineux (F7)
 * Projet: Visualisez l'OpenData au clair de lune
 */

export class LiveCounter {
  /**
   * @param {HTMLElement|string} element Élément cible ou sélecteur
   * @param {Object} [options]
   * @param {number} [options.duration=1200] Durée d'animation en ms
   * @param {string} [options.suffix=''] Suffixe textuel (ex: " lits")
   */
  constructor(element, options = {}) {
    this.el = typeof element === 'string' ? document.querySelector(element) : element;
    this.duration = options.duration || 1200;
    this.suffix = options.suffix || '';
    this.currentValue = 0;
    this.animationFrame = null;
  }

  /**
   * Transitionne vers une nouvelle valeur cible
   * @param {number} targetValue
   */
  update(targetValue) {
    if (!this.el) return;

    const target = Math.max(0, parseInt(targetValue, 10) || 0);
    const startValue = this.currentValue;
    const diff = target - startValue;

    if (diff === 0) {
      this.el.textContent = `${target}${this.suffix}`;
      return;
    }

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    const startTime = performance.now();

    // Fonction d'assouplissement cubique out (easeOutCubic)
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / this.duration, 1);
      const easedProgress = easeOutCubic(progress);

      const val = Math.round(startValue + diff * easedProgress);
      this.currentValue = val;
      this.el.textContent = `${val.toLocaleString('fr-FR')}${this.suffix}`;

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(step);
      } else {
        this.currentValue = target;
        this.el.textContent = `${target.toLocaleString('fr-FR')}${this.suffix}`;
        this.triggerHeartbeat();
      }
    };

    this.animationFrame = requestAnimationFrame(step);
  }

  /**
   * Déclenche une brève pulsation lumineuse cardiaque
   */
  triggerHeartbeat() {
    if (!this.el) return;
    this.el.classList.remove('animate-heartbeat');
    void this.el.offsetWidth; // Reflow pour redémarrer l'animation
    this.el.classList.add('animate-heartbeat');
  }
}
