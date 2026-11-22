/**
 * Composant Easter Egg « Clair de Lune » & Pluie d'Étoiles Filantes (F8)
 * Projet: Visualisez l'OpenData au clair de lune
 * Déclenchement: 3 clics sur la lune ou frappe clavier du mot secret "lune"
 */

import { eventBus } from '../core/eventBus.js';
import { EVENTS } from '../core/constants.js';

export class EasterEggComponent {
  constructor(canvasId = 'easter-egg-canvas') {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.isActive = false;
    this.animationId = null;
    this.stars = [];
    this.shootingStars = [];
    this.keyBuffer = [];
    this.SECRET_WORD = 'lune';
    this.cardEl = null;

    this.init();
  }

  init() {
    if (!this.canvas) return;

    this.resizeCanvas();
    this.bindEvents();
    this.createModalCard();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resizeCanvas());

    // 1. Écoute de l'événement direct (3 clics sur la lune)
    eventBus.on(EVENTS.EASTER_EGG_TRIGGERED, () => {
      this.trigger();
    });

    // 2. Écoute clavier pour le mot secret "lune"
    window.addEventListener('keydown', (e) => {
      if (['input', 'textarea'].includes(e.target.tagName.toLowerCase())) {
        return; // Ignorer dans les champs de saisie
      }

      this.keyBuffer.push(e.key.toLowerCase());
      if (this.keyBuffer.length > 10) {
        this.keyBuffer.shift();
      }

      const recentStr = this.keyBuffer.join('');
      if (recentStr.endsWith(this.SECRET_WORD)) {
        this.keyBuffer = [];
        this.trigger();
      }
    });
  }

  createModalCard() {
    this.cardEl = document.createElement('div');
    this.cardEl.id = 'easter-egg-modal-card';
    this.cardEl.className = 'easter-egg-card is-hidden';
    this.cardEl.innerHTML = `
      <div class="easter-egg-moon-badge">🌕</div>
      <h3 class="easter-egg-title">Clair de Lune — Hommage Nocturne</h3>
      <p class="easter-egg-quote">
        « La nuit parisienne veille avec pudeur et générosité.<br>
        Merci aux équipes, aux maraudeurs et aux structures d'urgence qui font vivre la solidarité au clair de lune. »
      </p>
      <div class="easter-egg-sub">Défi Apside 2026 • Futur des données ouvertes • Thématique Nuit</div>
      <button class="easter-egg-dismiss-btn" id="easter-egg-dismiss">Poursuivre la nuit ✨</button>
    `;

    const style = document.createElement('style');
    style.textContent = `
      .easter-egg-card {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.9);
        z-index: 9999;
        background: rgba(15, 23, 42, 0.92);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(226, 232, 240, 0.35);
        border-radius: var(--radius-lg);
        box-shadow: 0 0 50px rgba(226, 232, 240, 0.35), 0 20px 60px rgba(0, 0, 0, 0.8);
        padding: 2.25rem 2rem;
        max-width: 480px;
        width: 90%;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        opacity: 0;
        visibility: hidden;
        transition: all 600ms cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: auto;
      }
      .easter-egg-card.is-active {
        opacity: 1;
        visibility: visible;
        transform: translate(-50%, -50%) scale(1);
      }
      .easter-egg-moon-badge {
        font-size: 3.2rem;
        animation: pulseGlow 2s infinite ease-in-out;
      }
      .easter-egg-title {
        font-size: 1.35rem;
        font-weight: 700;
        background: linear-gradient(135deg, #FFFFFF, #E2E8F0, #94A3B8);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .easter-egg-quote {
        font-size: 0.95rem;
        font-style: italic;
        color: #E2E8F0;
        line-height: 1.6;
      }
      .easter-egg-sub {
        font-size: 0.75rem;
        color: var(--neon-ssp);
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
      .easter-egg-dismiss-btn {
        margin-top: 0.5rem;
        padding: 0.65rem 1.5rem;
        border-radius: var(--radius-full);
        background: linear-gradient(135deg, var(--neon-chu), var(--neon-ssp));
        color: #070A13;
        font-weight: 700;
        font-size: 0.88rem;
        transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        cursor: pointer;
      }
      .easter-egg-dismiss-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 0 20px rgba(57, 255, 20, 0.6);
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(this.cardEl);

    const dismissBtn = this.cardEl.querySelector('#easter-egg-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        this.stop();
      });
    }
  }

  trigger() {
    if (this.isActive) return;
    this.isActive = true;

    console.log("🌟 [Easter Egg] Clair de Lune activé !");

    // Activation visuelle du canvas
    this.canvas.classList.add('active');
    if (this.cardEl) {
      this.cardEl.classList.add('is-active');
    }

    this.initParticles();
    this.animate();

    // Auto-fermeture après 9 secondes
    setTimeout(() => {
      this.stop();
    }, 9000);
  }

  stop() {
    if (!this.isActive) return;
    this.isActive = false;

    if (this.canvas) {
      this.canvas.classList.remove('active');
    }
    if (this.cardEl) {
      this.cardEl.classList.remove('is-active');
    }
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  initParticles() {
    this.stars = [];
    this.shootingStars = [];

    // Étoiles scintillantes
    for (let i = 0; i < 70; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random(),
        speed: Math.random() * 0.02 + 0.005
      });
    }

    // Étoiles filantes
    for (let i = 0; i < 15; i++) {
      this.addShootingStar();
    }
  }

  addShootingStar() {
    this.shootingStars.push({
      x: Math.random() * this.canvas.width * 1.2 - this.canvas.width * 0.2,
      y: Math.random() * this.canvas.height * 0.5,
      length: Math.random() * 80 + 40,
      speed: Math.random() * 8 + 4,
      angle: Math.PI / 4, // 45 degrés
      alpha: 1
    });
  }

  animate() {
    if (!this.isActive || !this.ctx) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Dessin des étoiles scintillantes
    for (const star of this.stars) {
      star.alpha += star.speed;
      const opacity = (Math.sin(star.alpha) + 1) / 2;

      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(226, 232, 240, ${opacity * 0.8})`;
      this.ctx.fill();
    }

    // Dessin des étoiles filantes
    for (let i = 0; i < this.shootingStars.length; i++) {
      const s = this.shootingStars[i];
      const tailX = s.x - Math.cos(s.angle) * s.length;
      const tailY = s.y - Math.sin(s.angle) * s.length;

      const grad = this.ctx.createLinearGradient(s.x, s.y, tailX, tailY);
      grad.addColorStop(0, `rgba(255, 255, 255, ${s.alpha})`);
      grad.addColorStop(0.3, `rgba(0, 240, 255, ${s.alpha * 0.6})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      this.ctx.beginPath();
      this.ctx.moveTo(s.x, s.y);
      this.ctx.lineTo(tailX, tailY);
      this.ctx.strokeStyle = grad;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      s.x += Math.cos(s.angle) * s.speed;
      s.y += Math.sin(s.angle) * s.speed;
      s.alpha -= 0.01;

      if (s.alpha <= 0 || s.x > this.canvas.width || s.y > this.canvas.height) {
        this.shootingStars.splice(i, 1);
        i--;
        if (Math.random() < 0.3) {
          this.addShootingStar();
        }
      }
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }
}
