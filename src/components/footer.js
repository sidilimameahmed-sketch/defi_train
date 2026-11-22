/**
 * Composant Footer
 * Conforme au design « Paris Veille »
 */

export class FooterComponent {
  constructor(containerId = 'footer') {
    this.container = document.getElementById(containerId);
    this.init();
  }

  init() {
    if (!this.container) return;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div>
        <strong>NOCTURNE PARIS</strong>
        <span style="opacity: 0.5; margin: 0 6px;">|</span>
        <span>Visualisez l'OpenData au clair de lune</span>
      </div>

      <div class="footer-links">
        <span>Sources :</span>
        <a href="https://opendata.paris.fr" target="_blank" rel="noopener noreferrer">OpenData Paris</a>
        <span>•</span>
        <span>CASVP</span>
        <span>•</span>
        <span>Méthodologie</span>
      </div>
    `;
  }
}
