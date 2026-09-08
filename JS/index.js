/* ============================================
   NUESTRA HISTORIA – Atardecer de Girasoles JS
   Fixed layout + full mobile support
   ============================================ */

'use strict';

// ── UTILITIES ───────────────────────────────
const $    = (s, ctx = document) => ctx.querySelector(s);
const $$   = (s, ctx = document) => [...ctx.querySelectorAll(s)];
const rand = (a, b) => Math.random() * (b - a) + a;
const randInt = (a, b) => Math.floor(rand(a, b));
const clamp   = (v, a, b) => Math.min(Math.max(v, a), b);
const isMobile = () => window.innerWidth <= 560;

// Musica de fondo
(function initBackgroundMusic() {
    const music = $('#bg-music');
    if (!music) return;

    music.volume = 0.55;

    function playMusic() {
        if (!music.currentSrc && !music.src) return;
        music.play().catch(() => {});
    }

    window.addEventListener('load', playMusic, { once: true });

    ['click', 'touchstart', 'keydown'].forEach(eventName => {
        window.addEventListener(eventName, playMusic, { once: true, passive: true });
    });
})();

// ── PAGE LOADER ─────────────────────────────
(function initLoader() {
    const loader = $('#page-loader');
    if (!loader) return;
    const MIN_MS = 1100;
    const MAX_MS = 2600;
    const t0 = Date.now();

    function hideLoader() {
        const wait = Math.max(0, MIN_MS - (Date.now() - t0));
        setTimeout(() => loader.classList.add('hidden'), wait);
    }

    if (document.readyState === 'complete') {
        hideLoader();
    } else {
        window.addEventListener('load', hideLoader, { once: true });
    }

    setTimeout(hideLoader, MAX_MS);
})();

// ── AOS ─────────────────────────────────────
function initAosAnimations() {
    if (!window.AOS) return;
    AOS.init({ duration: 850, once: true, offset: 80, easing: 'ease-out-cubic', disable: false });
}
initAosAnimations();

// ── CONTADOR REAL ────────────────────────────
const FECHA_INICIO = new Date('February 08, 2026 00:00:00').getTime();
const counterEl    = $('#contador');

function pad(n) { return String(n).padStart(2, '0'); }

function updateCounter() {
    if (!counterEl) return;
    const diff = Date.now() - FECHA_INICIO;
    const dias    = Math.floor(diff / 86400000);
    const horas   = Math.floor((diff % 86400000) / 3600000);
    const minutos = Math.floor((diff % 3600000)  / 60000);
    const segs    = Math.floor((diff % 60000)    / 1000);
    counterEl.innerHTML =
        `${dias}d&nbsp;${pad(horas)}h&nbsp;${pad(minutos)}m&nbsp;${pad(segs)}s`;
}
updateCounter();
setInterval(updateCounter, 1000);

// ── LLUVIA CONTINUA: corazones + girasoles juntos ────
const rainContainer = $('#hearts-container');

const HEART_COLORS = ['#e63950', '#b4192f', '#ff7a8f', '#ffb3c0', '#d1264a'];

const HEART_SVG = `<svg viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg">
  <path d="M50,85 C50,85 5,55 5,28 C5,14 16,5 27,5 C36,5 44,10 50,18 C56,10 64,5 73,5 C84,5 95,14 95,28 C95,55 50,85 50,85Z"/>
</svg>`;

let activeRain = 0;
const MAX_RAIN = isMobile() ? 14 : 24;
let rainTimer = null;

function spawnRainItem(kind) {
    if (!rainContainer || activeRain >= MAX_RAIN) return;
    activeRain++;

    const el = document.createElement('div');
    el.className = 'rain-item';

    const opacity = rand(0.35, 0.75);
    const drift   = `${rand(-80, 80)}px`;
    const spin    = `${rand(-360, 360)}deg`;
    const scale   = rand(0.7, 1.3);
    const dur     = rand(6000, 11000);
    const x       = rand(2, 96);

    if (kind === 'heart') {
        const size  = rand(13, 32);
        const color = HEART_COLORS[randInt(0, HEART_COLORS.length)];
        el.style.cssText = `
            left: ${x}vw; width: ${size}px; height: ${size}px;
            --r-opacity: ${opacity}; --drift: ${drift}; --spin: ${spin}; --end-scale: ${scale};
            animation-duration: ${dur}ms;
        `;
        el.innerHTML = HEART_SVG;
        const path = el.querySelector('path');
        if (path) path.style.fill = color;
    } else {
        const size = rand(18, 34);
        el.style.cssText = `
            left: ${x}vw; font-size: ${size}px;
            --r-opacity: ${opacity}; --drift: ${drift}; --spin: ${spin}; --end-scale: ${scale};
            animation-duration: ${dur}ms;
        `;
        el.textContent = '🌻';
    }

    rainContainer.appendChild(el);
    el.addEventListener('animationend', () => {
        el.remove();
        activeRain = Math.max(0, activeRain - 1);
    }, { once: true });
}

function spawnRainPair() {
    // Siempre caen los dos juntos: un corazón y un girasol
    spawnRainItem('heart');
    setTimeout(() => spawnRainItem('sunflower'), rand(120, 320));
}

function startRain() {
    stopRain();
    const burst = isMobile() ? 3 : 5;
    for (let i = 0; i < burst; i++) setTimeout(spawnRainPair, i * 350);
    rainTimer = setInterval(spawnRainPair, isMobile() ? 900 : 650);
}
function stopRain() {
    clearInterval(rainTimer);
    rainTimer = null;
}

// Burst helper for interactions
function burstHearts(count = 8) {
    const n = isMobile() ? Math.ceil(count / 2) : count;
    for (let i = 0; i < n; i++) setTimeout(() => spawnRainItem('heart'), i * 90);
}

// Start after loader clears
setTimeout(startRain, 1300);

// ── PARTICLE CANVAS ──────────────────────────
(function initParticles() {
    const canvas = $('#particle-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W, H, particles = [];
    const COUNT = isMobile() ? 14 : 28;

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const DOT_COLORS = ['#ffb703', '#ffd166', '#e63950', '#ff7a8f'];

    class Dot {
        constructor(init = false) { this.reset(init); }
        reset(initial = false) {
            this.x  = rand(0, W);
            this.y  = initial ? rand(0, H) : rand(-10, 0);
            this.r  = rand(1.2, 3.5);
            this.vx = rand(-0.25, 0.25);
            this.vy = rand(0.18, 0.55);
            this.a  = rand(0.1, 0.42);
            this.da = rand(-0.0015, 0.0015);
            this.col = DOT_COLORS[randInt(0, DOT_COLORS.length)];
        }
        tick(t) {
            this.x += this.vx + Math.sin(t * 0.001 + this.x * 0.01) * 0.18;
            this.y += this.vy;
            this.a  = clamp(this.a + this.da, 0.05, 0.5);
            if (this.y > H + 8) this.reset();
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = this.col;
            ctx.globalAlpha = this.a;
            ctx.fill();
        }
    }

    for (let i = 0; i < COUNT; i++) particles.push(new Dot(true));

    let raf;
    function loop(t) {
        ctx.clearRect(0, 0, W, H);
        ctx.globalAlpha = 1;
        particles.forEach(p => { p.tick(t); p.draw(); });
        raf = requestAnimationFrame(loop);
    }
    loop(0);
})();

// ── NAVBAR + SCROLL ──────────────────────────
const sections     = $$('header[id], section[id]');
const navItems     = $$('.nav-item');
const navContainer = $('#main-nav');
let sunflowersFired = false;
let scrollRafPending = false;

function handleScroll() {
    scrollRafPending = false;
    const sy   = window.pageYOffset;
    const winH = window.innerHeight;
    const docH = document.body.scrollHeight;

    let current = sections[0]?.getAttribute('id') || '';
    sections.forEach(sec => {
        if (sy + winH * 0.4 >= sec.offsetTop) {
            current = sec.getAttribute('id');
        }
    });

    navItems.forEach(item => {
        const fn = item.getAttribute('onclick') || '';
        item.classList.toggle('active', fn.includes(current));
    });

    const atBottom = sy + winH >= docH - 100;
    if (atBottom) {
        navContainer.classList.add('nav-hidden');
        if (!sunflowersFired) {
            sunflowersFired = true;
            triggerSunflowers();
        }
    } else {
        navContainer.classList.remove('nav-hidden');
        if (sy < 500) sunflowersFired = false;
    }
}

window.addEventListener('scroll', () => {
    if (!scrollRafPending) {
        scrollRafPending = true;
        requestAnimationFrame(handleScroll);
    }
}, { passive: true });

handleScroll();

// ── ESCENA FINAL (climax de girasoles) ───────
const sfContainer = $('#sunflowers-container');

function triggerSunflowers() {
    stopRain(); // pausa la lluvia ambiental durante el climax

    const mobile     = isMobile();
    const rainCount  = mobile ? 18 : 36;
    const bloomCount = mobile ? 7  : 13;

    for (let i = 0; i < rainCount; i++) {
        setTimeout(() => spawnSfRain(), i * 80 + rand(0, 60));
    }

    for (let j = 0; j < bloomCount; j++) {
        setTimeout(() => spawnSfBloom(j, bloomCount), 250 + j * 110);
    }

    setTimeout(() => {
        startRain();
        $$('.sf-bloom').forEach(el => {
            el.style.transition = 'opacity 1.4s ease';
            el.style.opacity    = '0';
            setTimeout(() => el.remove(), 1400);
        });
    }, 7500);
}

function spawnSfRain() {
    if (!sfContainer) return;
    const sf       = document.createElement('div');
    sf.className   = 'sf-particle';
    const size     = rand(20, 42);
    const x        = rand(1, 97);
    const dur      = rand(2200, 4800);
    const spin     = `${rand(-500, 500)}deg`;
    sf.style.cssText = `
        left: ${x}vw; top: -55px;
        font-size: ${size}px;
        --sf-spin: ${spin};
        animation-duration: ${dur}ms;
        animation-delay: ${rand(0, 200)}ms;
    `;
    sf.textContent = '🌻';
    sfContainer.appendChild(sf);
    sf.addEventListener('animationend', () => sf.remove(), { once: true });
}

function spawnSfBloom(index, total) {
    const sf         = document.createElement('div');
    sf.className     = 'sf-bloom';
    const spread     = 96 / (total + 1);
    const baseX      = spread * (index + 1) + 2;
    const jitter     = rand(-spread * 0.28, spread * 0.28);
    const finalX     = clamp(baseX + jitter, 2, 96);
    const size       = rand(30, 56);
    const delay      = rand(0, 0.25);
    const swayDelay  = rand(0.75, 1.5);

    sf.style.cssText = `
        left: ${finalX}vw;
        --sf-size: ${size}px;
        --sf-delay: ${delay}s;
        --sf-sway-delay: ${swayDelay}s;
        animation-delay: ${delay}s, ${swayDelay}s;
    `;
    sf.textContent = '🌻';
    document.body.appendChild(sf);
}

// ── DARK MODE ────────────────────────────────
const themeBtn = $('#theme-toggle');
let isDark = true;

themeBtn?.addEventListener('click', () => {
    isDark = !isDark;
    document.body.setAttribute('data-theme', isDark ? 'dark' : '');
    themeBtn.innerHTML = isDark
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
});

// ── SCROLL TO SECTION ────────────────────────
function scrollToSection(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - 16;
    window.scrollTo({ top: y, behavior: 'smooth' });
}

// ── ENVELOPE ────────────────────────────────
function openEnvelope() {
    const env = $('.envelope-wrapper');
    if (!env) return;
    env.classList.toggle('open');
    if (env.classList.contains('open')) {
        burstHearts(6);
    }
}

// ── SORPRESA ─────────────────────────────────
function soltarSorpresa() {
    burstHearts(14);
    setTimeout(() => {
        alert('¡Eres lo más lindo de mi vida, Anita! ❤️');
    }, 180);
}

// ── MENSAJE ESPECIAL ─────────────────────────
function mensajeEspecial() {
    if (confirm('¿Sabes cuánto te amo?')) {
        alert('Muchisimo mi negrita <3');
    }
}

// ── MES 7: NOTAS DE COSTUMBRE (acordeón simple) ──
function toggleNota(btn) {
    if (!btn) return;
    const yaAbierta = btn.classList.contains('abierta');

    // Cierra las demás para que solo una esté abierta a la vez
    $$('.nota-item.abierta').forEach(n => { if (n !== btn) n.classList.remove('abierta'); });

    btn.classList.toggle('abierta', !yaAbierta);
    if (!yaAbierta) burstHearts(4);
}

// ── KEYBOARD NAV (accesibilidad extra para el sobre) ─
$$('.nav-item, .envelope-wrapper').forEach(el => {
    el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            el.click();
        }
    });
});

function abrirCartaLarga() {
    document.getElementById("carta-modal").classList.add("active");
    burstHearts(20);
}

function cerrarCartaLarga() {
    document.getElementById("carta-modal").classList.remove("active");
}
