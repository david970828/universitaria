/* ============================================================
   script.js — El Arte de la Contaduría
   Presentación académica interactiva — v2 con fondo dinámico
   ============================================================ */

'use strict';

/* ============================================================
   CONFIGURACIÓN DE FONDOS POR ERA
   Cada era tiene: imagen de fondo, color de overlay tintado
   ============================================================ */
const ERA_CONFIG = {
  antiguedad: {
    overlay: 'rgba(90, 40, 0, .55)',
    label:   'Era Primitiva & Antigüedad Clásica'
  },
  'edad-media': {
    overlay: 'rgba(40, 10, 80, .60)',
    label:   'Edad Media'
  },
  modernidad: {
    overlay: 'rgba(10, 25, 70, .60)',
    label:   'Modernidad & Revolución Industrial'
  },
  contemporaneo: {
    overlay: 'rgba(2, 40, 25, .58)',
    label:   'Era Contemporánea'
  }
};

/* ============================================================
   INICIALIZACIÓN
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  AOS.init({ duration: 750, easing: 'ease-out-cubic', once: true, offset: 70 });

  buildSceneLayers();
  initParticles();
  initNavbar();
  initNavToggle();
  initBtnTop();
  initTimelineGrowLine();
  initMapaTooltips();
  initSmoothScroll();
  initTimelineBackground();
});

/* ============================================================
   1. CONSTRUIR CAPAS DE FONDO DINÁMICO
   Crea un <div.scene-layer> por cada timeline-item con data-bg
   ============================================================ */
function buildSceneLayers() {
  const sceneBg = document.getElementById('scene-bg');
  if (!sceneBg) return;

  const items = document.querySelectorAll('.timeline-item[data-bg]');
  items.forEach((item, i) => {
    const layer = document.createElement('div');
    layer.className = 'scene-layer';
    layer.dataset.index = i;
    layer.style.backgroundImage = `url('${item.dataset.bg}')`;
    sceneBg.appendChild(layer);
    // Guardar referencia en el item
    item.dataset.layerIndex = i;
  });
}

/* ============================================================
   2. FONDO DINÁMICO — cambia al hacer scroll por la línea del tiempo
   ============================================================ */
function initTimelineBackground() {
  const overlay   = document.getElementById('scene-overlay');
  const indicator = document.getElementById('era-indicator');
  const layers    = document.querySelectorAll('.scene-layer');
  const items     = document.querySelectorAll('.timeline-item[data-bg]');
  const section   = document.getElementById('linea-tiempo');

  if (!overlay || !layers.length || !section) return;

  let activeIndex  = -1;
  let indicatorTimer = null;

  /* Observa la sección completa para activar/desactivar el fondo */
  const sectionObserver = new IntersectionObserver(
    ([entry]) => {
      document.body.classList.toggle('timeline-active', entry.isIntersecting);
      if (!entry.isIntersecting) {
        // Apagar todas las capas al salir de la sección
        layers.forEach(l => l.classList.remove('active'));
        overlay.style.background = 'rgba(10,15,30,.0)';
        if (indicator) indicator.classList.remove('visible');
        activeIndex = -1;
      }
    },
    { threshold: 0.05 }
  );
  sectionObserver.observe(section);

  /* Observa cada tarjeta individualmente */
  const cardObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const item  = entry.target;
        const idx   = parseInt(item.dataset.layerIndex, 10);
        const era   = item.dataset.era;
        const label = item.dataset.eraLabel || '';

        if (idx === activeIndex) return;
        activeIndex = idx;

        // Crossfade de capas
        layers.forEach((l, i) => l.classList.toggle('active', i === idx));

        // Cambiar tinte del overlay
        const cfg = ERA_CONFIG[era] || {};
        overlay.style.background = cfg.overlay || 'rgba(10,15,30,.65)';
        overlay.style.transition = 'background 1.2s cubic-bezier(.4,0,.2,1)';

        // Mostrar indicador de era
        if (indicator && label) {
          indicator.textContent = label;
          indicator.classList.add('visible');
          clearTimeout(indicatorTimer);
          indicatorTimer = setTimeout(() => indicator.classList.remove('visible'), 3000);
        }
      });
    },
    {
      rootMargin: '-30% 0px -30% 0px',
      threshold: 0
    }
  );

  items.forEach(item => cardObserver.observe(item));
}

/* ============================================================
   3. PARTÍCULAS EN CANVAS (Portada)
   ============================================================ */
class Particle {
  constructor(w, h) { this.reset(w, h); }

  reset(w, h) {
    this.x     = Math.random() * w;
    this.y     = Math.random() * h;
    this.vx    = (Math.random() - 0.5) * 0.55;
    this.vy    = (Math.random() - 0.5) * 0.55;
    this.radio = Math.random() * 2.2 + 0.7;
    this.color = Math.random() > 0.5
      ? `rgba(201,168,76,${(Math.random() * 0.5 + 0.2).toFixed(2)})`
      : `rgba(100,160,220,${(Math.random() * 0.4 + 0.15).toFixed(2)})`;
  }

  update(w, h) {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > w) this.vx *= -1;
    if (this.y < 0 || this.y > h) this.vy *= -1;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radio, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

function initParticles() {
  const canvas = document.getElementById('particles');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  const NUM = 100;

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  function create() {
    particles = Array.from({ length: NUM }, () => new Particle(canvas.width, canvas.height));
  }

  function drawConnections() {
    const MAX = 115;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < MAX) {
          const a = (1 - d / MAX) * 0.22;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(201,168,76,${a.toFixed(3)})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawConnections();
    particles.forEach(p => { p.update(canvas.width, canvas.height); p.draw(ctx); });
    requestAnimationFrame(animate);
  }

  resize(); create(); animate();
  window.addEventListener('resize', () => { resize(); create(); });
}

/* ============================================================
   4. NAVBAR — scroll activo con IntersectionObserver
   ============================================================ */
function initNavbar() {
  const navbar   = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  const sections = document.querySelectorAll('section[id]');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
  );

  sections.forEach(sec => observer.observe(sec));
}

/* ============================================================
   5. NAVBAR TOGGLE (hamburguesa móvil)
   ============================================================ */
function initNavToggle() {
  const toggle = document.getElementById('navToggle');
  const links  = document.querySelector('.nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', links.classList.contains('open'));
  });

  links.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => links.classList.remove('open'));
  });
}

/* ============================================================
   6. BOTÓN VOLVER ARRIBA
   ============================================================ */
function initBtnTop() {
  const btn = document.getElementById('btn-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 300);
  }, { passive: true });

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ============================================================
   7. SCROLL SUAVE
   ============================================================ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const navH = document.getElementById('navbar')?.offsetHeight || 70;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navH, behavior: 'smooth' });
    });
  });
}

/* ============================================================
   8. LÍNEA DEL TIEMPO — crece con scroll
   ============================================================ */
function initTimelineGrowLine() {
  window.addEventListener('scroll', updateTimelineLine, { passive: true });
  updateTimelineLine();
}

function updateTimelineLine() {
  const line    = document.getElementById('timelineLine');
  const wrapper = document.querySelector('.timeline-wrapper');
  if (!line || !wrapper) return;

  const wTop = wrapper.getBoundingClientRect().top + window.scrollY;
  const wH   = wrapper.offsetHeight;
  const prog = Math.min(Math.max((window.scrollY + window.innerHeight - wTop) / wH, 0), 1);
  line.style.height = `${prog * wH}px`;
}

/* ============================================================
   9. MAPA CONCEPTUAL — tooltips
   ============================================================ */
function initMapaTooltips() {
  const svgEl   = document.getElementById('mapa-svg');
  const tooltip = document.getElementById('mapa-tooltip');
  if (!svgEl || !tooltip) return;

  svgEl.querySelectorAll('.mapa-nodo').forEach(nodo => {
    const texto = nodo.dataset.tooltip || '';

    function show(e) {
      tooltip.textContent = texto;
      tooltip.classList.add('visible');
      position(e);
    }

    function hide() { tooltip.classList.remove('visible'); }

    function position(e) {
      const wrapper = svgEl.closest('.mapa-wrapper');
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      let x = e.clientX - rect.left + 14;
      let y = e.clientY - rect.top  - 10;
      const tipW = tooltip.offsetWidth || 270;
      if (x + tipW > wrapper.offsetWidth) x = e.clientX - rect.left - tipW - 14;
      tooltip.style.left = `${x}px`;
      tooltip.style.top  = `${y}px`;
    }

    nodo.addEventListener('mouseenter', show);
    nodo.addEventListener('mousemove',  position);
    nodo.addEventListener('mouseleave', hide);

    nodo.addEventListener('focus', () => {
      tooltip.textContent = texto;
      tooltip.classList.add('visible');
      const wrapper = svgEl.closest('.mapa-wrapper');
      if (!wrapper) return;
      const wRect = wrapper.getBoundingClientRect();
      const nRect = nodo.getBoundingClientRect();
      tooltip.style.left = `${nRect.left - wRect.left}px`;
      tooltip.style.top  = `${nRect.bottom - wRect.top + 8}px`;
    });

    nodo.addEventListener('blur', hide);
  });

  svgEl.addEventListener('mouseleave', () => tooltip.classList.remove('visible'));
}

/* ============================================================
   10. ANIMACIÓN DE ENTRADA DE TARJETAS (fallback sin AOS)
   ============================================================ */
(function observeTimelineCards() {
  const cards = document.querySelectorAll('.timeline-card');
  if (!cards.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity   = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    },
    { threshold: 0.1 }
  );

  cards.forEach(card => {
    if (!card.closest('[data-aos]')) {
      card.style.opacity    = '0';
      card.style.transform  = 'translateY(28px)';
      card.style.transition = 'opacity .6s ease, transform .6s ease';
    }
    observer.observe(card);
  });
})();

/* ============================================================
   FIN DEL SCRIPT
   ============================================================ */
