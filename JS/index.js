/* ============================================
   NUESTRA HISTORIA – Atardecer de Girasoles JS
   Optimizado para celular · sin alert() nativos
   ============================================ */

'use strict';

// ── UTILIDADES ──────────────────────────────
const $    = (s, ctx = document) => ctx.querySelector(s);
const $$   = (s, ctx = document) => [...ctx.querySelectorAll(s)];
const rand = (a, b) => Math.random() * (b - a) + a;
const randInt = (a, b) => Math.floor(rand(a, b));
const clamp   = (v, a, b) => Math.min(Math.max(v, a), b);
const isMobile = () => window.innerWidth <= 560;
const esTactil = window.matchMedia('(pointer: coarse)').matches;
const menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function guardar(clave, valor) { try { localStorage.setItem(clave, valor); } catch (e) {} }
function leer(clave) { try { return localStorage.getItem(clave); } catch (e) { return null; } }

// ── MÚSICA DE FONDO (con botón para pausar) ──
const music    = $('#bg-music');
const musicBtn = $('#music-toggle');
let musicaPausadaPorUsuario = false;

function pintarBotonMusica() {
    if (!musicBtn || !music) return;
    const sonando = !music.paused;
    musicBtn.innerHTML = sonando ? '<i class="fas fa-music"></i>' : '<i class="fas fa-volume-xmark"></i>';
    musicBtn.setAttribute('aria-label', sonando ? 'Pausar música' : 'Reproducir música');
    musicBtn.setAttribute('aria-pressed', String(sonando));
    musicBtn.classList.toggle('sonando', sonando);
}

function playMusic() {
    if (!music || musicaPausadaPorUsuario) return;
    music.play().then(pintarBotonMusica).catch(() => {});
}

if (music) {
    music.volume = 0.55;
    music.addEventListener('play', pintarBotonMusica);
    music.addEventListener('pause', pintarBotonMusica);
    window.addEventListener('load', playMusic, { once: true });

    // El primer toque en cualquier parte arranca la música (los navegadores
    // de celular no dejan reproducir audio sin una interacción del usuario).
    const primerToque = (e) => {
        if (musicBtn && musicBtn.contains(e.target)) return; // el botón decide solo
        playMusic();
        ['click', 'touchend', 'keydown'].forEach(ev => window.removeEventListener(ev, primerToque));
    };
    ['click', 'touchend', 'keydown'].forEach(ev => window.addEventListener(ev, primerToque, { passive: true }));
}

musicBtn?.addEventListener('click', () => {
    if (!music) return;
    if (music.paused) {
        musicaPausadaPorUsuario = false;
        music.play().catch(() => {});
    } else {
        musicaPausadaPorUsuario = true;
        music.pause();
    }
});
pintarBotonMusica();

// ── PAGE LOADER ─────────────────────────────
(function initLoader() {
    const loader = $('#page-loader');
    if (!loader) return;
    const MIN_MS = 900;
    const MAX_MS = 2600;
    const t0 = Date.now();
    let oculto = false;

    function hideLoader() {
        if (oculto) return;
        oculto = true;
        const wait = Math.max(0, MIN_MS - (Date.now() - t0));
        setTimeout(() => loader.classList.add('hidden'), wait);
    }

    if (document.readyState === 'complete') hideLoader();
    else window.addEventListener('load', hideLoader, { once: true });
    setTimeout(hideLoader, MAX_MS);
})();

// ── AOS (con respaldo si el CDN no carga) ───
(function initAosAnimations() {
    if (window.AOS) {
        AOS.init({ duration: 800, once: true, offset: isMobile() ? 40 : 80, easing: 'ease-out-cubic', disable: menosMovimiento });
        window.addEventListener('load', () => AOS.refresh(), { once: true });
    } else {
        // Si el CSS de AOS cargó pero el JS no, todo quedaría invisible:
        // quitamos los atributos para que el contenido siempre se vea.
        $$('[data-aos]').forEach(el => el.removeAttribute('data-aos'));
    }
})();

// ── CONTADOR REAL ────────────────────────────
// new Date(año, mes-1, día) funciona igual en todos los navegadores
// (el formato de texto "February 08, 2026" falla en algunos Safari viejos).
const FECHA_INICIO = new Date(2026, 1, 8, 0, 0, 0);
const counterEl    = $('#contador');
const mesesEl      = $('#contador-meses');

function pad(n) { return String(n).padStart(2, '0'); }

function mesesCumplidos(desde, hasta) {
    let meses = (hasta.getFullYear() - desde.getFullYear()) * 12 + (hasta.getMonth() - desde.getMonth());
    if (hasta.getDate() < desde.getDate()) meses--;
    const aniversario = new Date(desde.getFullYear(), desde.getMonth() + meses, desde.getDate());
    const dias = Math.floor((hasta - aniversario) / 86400000);
    return { meses: Math.max(0, meses), dias: Math.max(0, dias) };
}

function updateCounter() {
    const ahora = new Date();
    const diff = Math.max(0, ahora - FECHA_INICIO);
    if (counterEl) {
        const dias    = Math.floor(diff / 86400000);
        const horas   = Math.floor((diff % 86400000) / 3600000);
        const minutos = Math.floor((diff % 3600000)  / 60000);
        const segs    = Math.floor((diff % 60000)    / 1000);
        counterEl.innerHTML = `${dias}d&nbsp;${pad(horas)}h&nbsp;${pad(minutos)}m&nbsp;${pad(segs)}s`;
    }
    if (mesesEl) {
        const { meses, dias } = mesesCumplidos(FECHA_INICIO, ahora);
        const txtMeses = `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
        mesesEl.textContent = dias === 0
            ? `¡Hoy cumplimos ${txtMeses}! 🌻`
            : `${txtMeses} y ${dias} ${dias === 1 ? 'día' : 'días'}`;
    }
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
const MAX_RAIN = isMobile() ? 12 : 24;
let rainTimer = null;

function spawnRainItem(kind) {
    if (!rainContainer || activeRain >= MAX_RAIN || document.hidden) return;
    activeRain++;

    const el = document.createElement('div');
    el.className = 'rain-item';

    const opacity = rand(0.35, 0.75);
    const drift   = `${rand(-80, 80)}px`;
    const spin    = `${rand(-360, 360)}deg`;
    const scale   = rand(0.7, 1.3);
    const dur     = rand(6000, 11000);
    const x       = rand(2, 94);

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

    // Respaldo: si "animationend" no llega (pestaña en segundo plano),
    // igual liberamos el cupo para que la lluvia no se quede congelada.
    let liberado = false;
    const liberar = () => {
        if (liberado) return;
        liberado = true;
        el.remove();
        activeRain = Math.max(0, activeRain - 1);
    };
    el.addEventListener('animationend', liberar, { once: true });
    setTimeout(liberar, dur + 600);
}

function spawnRainPair() {
    spawnRainItem('heart');
    setTimeout(() => spawnRainItem('sunflower'), rand(120, 320));
}

function startRain() {
    stopRain();
    if (menosMovimiento) return;
    const burst = isMobile() ? 3 : 5;
    for (let i = 0; i < burst; i++) setTimeout(spawnRainPair, i * 350);
    rainTimer = setInterval(spawnRainPair, isMobile() ? 1000 : 650);
}
function stopRain() {
    clearInterval(rainTimer);
    rainTimer = null;
}

// Ráfaga de corazones para las interacciones
function burstHearts(count = 8) {
    const n = isMobile() ? Math.ceil(count / 2) : count;
    for (let i = 0; i < n; i++) setTimeout(() => spawnRainItem('heart'), i * 90);
}

setTimeout(startRain, 1300);

document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopRain();
    else startRain();
});

// ── PARTICLE CANVAS ──────────────────────────
(function initParticles() {
    const canvas = $('#particle-canvas');
    if (!canvas || menosMovimiento) return;

    const ctx = canvas.getContext('2d');
    let W, H, particles = [];
    const COUNT = isMobile() ? 14 : 28;

    function resize() {
        // En celular la barra del navegador cambia el alto al hacer scroll:
        // solo redimensionamos si el cambio es real (evita parpadeos).
        const nw = window.innerWidth, nh = window.innerHeight;
        if (nw === W && Math.abs(nh - H) < 120) return;
        W = canvas.width  = nw;
        H = canvas.height = nh;
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

    function loop(t) {
        ctx.clearRect(0, 0, W, H);
        ctx.globalAlpha = 1;
        particles.forEach(p => { p.tick(t); p.draw(); });
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
})();

// ── NAVBAR + SCROLL ──────────────────────────
const sections     = $$('header[id], section[id]');
const navItems     = $$('.nav-item');
const navContainer = $('#main-nav');
let sunflowersFired = false;
let scrollRafPending = false;
let navActual = '';

// Cada botón del menú sabe a qué sección apunta
navItems.forEach(item => {
    const m = (item.getAttribute('onclick') || '').match(/scrollToSection\('([^']+)'\)/);
    if (m) item.dataset.target = m[1];
});

function centrarItemNav(item) {
    if (!navContainer || !item) return;
    if (navContainer.scrollWidth <= navContainer.clientWidth + 2) return;
    const left = item.offsetLeft - (navContainer.clientWidth - item.offsetWidth) / 2;
    navContainer.scrollTo({ left, behavior: 'smooth' });
}

function handleScroll() {
    scrollRafPending = false;
    const sy   = window.pageYOffset;
    const winH = window.innerHeight;
    const docH = document.documentElement.scrollHeight;

    // getBoundingClientRect da la posición real en la página
    // (offsetTop era relativo a <main> y marcaba mal el mes activo).
    let current = sections[0]?.id || '';
    sections.forEach(sec => {
        if (sec.getBoundingClientRect().top <= winH * 0.4) current = sec.id;
    });

    if (current !== navActual) {
        navActual = current;
        let activo = null;
        navItems.forEach(item => {
            const on = item.dataset.target === current;
            item.classList.toggle('active', on);
            if (on) { activo = item; item.setAttribute('aria-current', 'true'); }
            else item.removeAttribute('aria-current');
        });
        centrarItemNav(activo);
    }

    const atBottom = sy + winH >= docH - 100;
    if (atBottom) {
        navContainer?.classList.add('nav-hidden');
        if (!sunflowersFired) {
            sunflowersFired = true;
            triggerSunflowers();
        }
    } else {
        navContainer?.classList.remove('nav-hidden');
        if (sy < 500) sunflowersFired = false;
    }
}

window.addEventListener('scroll', () => {
    if (!scrollRafPending) {
        scrollRafPending = true;
        requestAnimationFrame(handleScroll);
    }
}, { passive: true });
window.addEventListener('resize', () => { navActual = ''; handleScroll(); }, { passive: true });

handleScroll();

// ── ESCENA FINAL (clímax de girasoles) ───────
const sfContainer = $('#sunflowers-container');

function triggerSunflowers() {
    if (menosMovimiento) return;
    stopRain();

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
    const x        = rand(1, 94);
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
    setTimeout(() => sf.remove(), dur + 800);
}

function spawnSfBloom(index, total) {
    const sf         = document.createElement('div');
    sf.className     = 'sf-bloom';
    const spread     = 92 / (total + 1);
    const baseX      = spread * (index + 1) + 2;
    const jitter     = rand(-spread * 0.28, spread * 0.28);
    const finalX     = clamp(baseX + jitter, 2, 92);
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

// ── MODO OSCURO / CLARO (se recuerda) ────────
const themeBtn  = $('#theme-toggle');
const metaTheme = $('meta[name="theme-color"]');
let isDark = leer('anita-tema') !== 'claro';

function aplicarTema() {
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if (themeBtn) {
        themeBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        themeBtn.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    }
    if (metaTheme) metaTheme.setAttribute('content', isDark ? '#170f07' : '#fff2da');
}
aplicarTema();

themeBtn?.addEventListener('click', () => {
    isDark = !isDark;
    aplicarTema();
    guardar('anita-tema', isDark ? 'oscuro' : 'claro');
});

// ── SCROLL TO SECTION ────────────────────────
function scrollToSection(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - 16;
    window.scrollTo({ top: y, behavior: menosMovimiento ? 'auto' : 'smooth' });
}

// ── BLOQUEO DE SCROLL (para modales en celular) ──
let modalesAbiertos = 0;
function bloquearScroll(bloquear) {
    modalesAbiertos = Math.max(0, modalesAbiertos + (bloquear ? 1 : -1));
    document.documentElement.classList.toggle('sin-scroll', modalesAbiertos > 0);
}

// ── AVISO BONITO (reemplaza alert / confirm) ──
// Los alert() nativos se ven feos en celular y los navegadores internos
// de WhatsApp / Instagram / TikTok a veces los bloquean.
const avisoModal   = $('#aviso-modal');
const avisoTexto   = $('#aviso-texto');
const avisoIcono   = $('#aviso-icono');
const avisoBotones = $('#aviso-botones');

function mostrarAviso(texto, { icono = '🌻', botones = [{ texto: 'Cerrar' }] } = {}) {
    if (!avisoModal) { window.alert(texto); return; }
    avisoTexto.textContent = texto;
    avisoIcono.textContent = icono;
    avisoBotones.innerHTML = '';
    botones.forEach((b, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'aviso-btn' + (i === 0 ? ' principal' : '');
        btn.textContent = b.texto;
        btn.addEventListener('click', () => {
            cerrarAviso();
            if (typeof b.accion === 'function') setTimeout(b.accion, 180);
        });
        avisoBotones.appendChild(btn);
    });
    if (avisoModal.hidden) bloquearScroll(true);
    avisoModal.hidden = false;
    if (!esTactil) setTimeout(() => avisoBotones.querySelector('button')?.focus({ preventScroll: true }), 50);
}

function cerrarAviso() {
    if (!avisoModal || avisoModal.hidden) return;
    avisoModal.hidden = true;
    bloquearScroll(false);
}

avisoModal?.addEventListener('click', (e) => { if (e.target === avisoModal) cerrarAviso(); });

// ── ENVELOPE ────────────────────────────────
function openEnvelope() {
    const env = $('.envelope-wrapper');
    if (!env) return;
    env.classList.toggle('open');
    env.setAttribute('aria-label', env.classList.contains('open') ? 'Cerrar carta' : 'Abrir carta');
    if (env.classList.contains('open')) burstHearts(6);
}

// ── SORPRESA ─────────────────────────────────
function soltarSorpresa() {
    burstHearts(14);
    mostrarAviso('¡Eres lo más lindo de mi vida, Anita! ❤️', { icono: '💖', botones: [{ texto: 'Aww 🥰' }] });
}

// ── MENSAJE ESPECIAL ─────────────────────────
function mensajeEspecial() {
    const respuesta = () => {
        burstHearts(10);
        mostrarAviso('Muchísimo, mi negrita ❤️', { icono: '💛', botones: [{ texto: 'Yo también 🌻' }] });
    };
    mostrarAviso('¿Sabes cuánto te amo?', {
        icono: '💌',
        botones: [
            { texto: 'Sí 🥺', accion: respuesta },
            { texto: 'Dime…', accion: respuesta },
        ],
    });
}

// ── BUZÓN: enviar mensaje por WhatsApp ────────
function enviarBuzon() {
    const campo = $('#buzon-texto');
    const texto = campo ? campo.value.trim() : '';

    if (!texto) {
        mostrarAviso('Escribe algo antes de enviarlo 🌻', {
            icono: '✍️',
            botones: [{ texto: 'Ok', accion: () => campo?.focus() }],
        });
        return;
    }

    const numero  = '573117501963';
    const mensaje = encodeURIComponent(`💌 Mensaje desde nuestra página:\n\n${texto}`);
    const url     = `https://wa.me/${numero}?text=${mensaje}`;

    // En celular abrimos en la misma pestaña (los navegadores internos
    // bloquean ventanas nuevas); en computador, en una pestaña nueva.
    if (esTactil) {
        window.location.href = url;
    } else {
        const w = window.open(url, '_blank', 'noopener');
        if (!w) window.location.href = url;
    }

    burstHearts(8);
    if (campo) campo.value = '';
}

// ── MES 7: NOTAS DE COSTUMBRE (acordeón) ──
function toggleNota(btn) {
    if (!btn) return;
    const yaAbierta = btn.classList.contains('abierta');
    $$('.nota-item.abierta').forEach(n => {
        if (n !== btn) { n.classList.remove('abierta'); n.setAttribute('aria-expanded', 'false'); }
    });
    btn.classList.toggle('abierta', !yaAbierta);
    btn.setAttribute('aria-expanded', String(!yaAbierta));
    if (!yaAbierta) burstHearts(4);
}
$$('.nota-item').forEach(n => n.setAttribute('aria-expanded', 'false'));

// ── MES 8: frases de los ocho meses ──────────
const FRASES_MES8 = [
    'El 8 acostado es infinito… y así quiero que sea lo nuestro.',
    'Ocho meses contigo y todavía no me acostumbro a lo bonito que es quererte.',
    'Más de 240 días después, sigues siendo mi pensamiento favorito.',
    'Ocho meses de risas, de abrazos y de aprender a amarte mejor.',
    'Si me dieran a elegir otra vez, te elegiría ocho meses más, y ocho más, y ocho más…',
    'En ocho meses me enseñaste que el amor bonito sí existe.',
    'Ocho meses y mi corazón sigue sonriendo cada vez que llega un mensaje tuyo.',
    'Gracias por estos ocho meses de paciencia, cariño y locura compartida.',
    'No cuento los meses por costumbre, los cuento porque cada uno contigo vale la pena.',
    'Ocho meses floreciendo juntos, como girasoles buscando el mismo sol.',
    'Eres mi casualidad más bonita y mi decisión más segura.',
    'Ocho meses después, sigo queriendo descubrir todo de ti.',
    'Contigo aprendí que los días malos se arreglan con un abrazo tuyo.',
    'Ocho meses de nosotros, y apenas estamos empezando.',
    'Mi parte favorita del día sigue siendo la que paso contigo.',
    'Ocho meses y todavía me ganas en todas las discusiones con una sola sonrisa.',
    'De todos los caminos posibles, qué bonito fue que el mío llegara al tuyo.',
    'Ocho meses guardando recuerdos, y todavía me sobra espacio para mil más.',
    'Tú y yo, ocho meses, un montón de momentos y cero arrepentimientos.',
    'Feliz mes 8, negrita. Te quiero hoy más que ayer y menos que mañana.',
];
let indiceMes8 = 0;

function siguienteFraseMes8() {
    const fraseEl = $('#mes8-frase');
    const contEl  = $('#mes8-contador');
    if (!fraseEl) return;

    indiceMes8 = (indiceMes8 + 1) % FRASES_MES8.length;
    fraseEl.classList.add('cambiando');
    setTimeout(() => {
        fraseEl.textContent = FRASES_MES8[indiceMes8];
        if (contEl) contEl.textContent = `${indiceMes8 + 1} / ${FRASES_MES8.length}`;
        fraseEl.classList.remove('cambiando');
    }, 300);
    burstHearts(5);
}

(function initMes8() {
    const contEl = $('#mes8-contador');
    if (contEl) contEl.textContent = `1 / ${FRASES_MES8.length}`;
})();

// ── TECLADO (accesibilidad) ──────────────────
$$('.nav-item, .envelope-wrapper').forEach(el => {
    el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            el.click();
        }
    });
});

// ── CARTA LARGA ──────────────────────────────
const cartaModal = $('#carta-modal');

function abrirCartaLarga() {
    if (!cartaModal || cartaModal.classList.contains('active')) return;
    cartaModal.classList.add('active');
    bloquearScroll(true);
    burstHearts(20);
}

function cerrarCartaLarga() {
    if (!cartaModal || !cartaModal.classList.contains('active')) return;
    cartaModal.classList.remove('active');
    bloquearScroll(false);
}

// Tocar fuera de la carta también la cierra
cartaModal?.addEventListener('click', (e) => { if (e.target === cartaModal) cerrarCartaLarga(); });

// Escape cierra lo que esté abierto
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    cerrarAviso();
    cerrarCartaLarga();
    if (typeof window.cerrarMensajeGalaxia === 'function') window.cerrarMensajeGalaxia();
});

// ══════════════════════════════════════════════
// GALAXIA · 300 estrellas, 300 frases (Three.js)
// Three.js se descarga SOLO cuando ella se acerca a la galaxia
// (ahorra ~800 KB en la carga inicial del celular). Las 300 estrellas
// se dibujan con "instancing": 2 llamadas de dibujo en vez de 600.
// ══════════════════════════════════════════════
(function initGalaxia() {
    const contenedor = document.getElementById('galaxia-contenedor');
    const canvas      = document.getElementById('galaxia-canvas');
    const cargando    = document.getElementById('galaxia-cargando');
    const mensajeBox  = document.getElementById('galaxia-mensaje');
    const mensajeTxt  = document.getElementById('galaxia-mensaje-texto');
    if (!contenedor || !canvas) return;

    // ── 300 frases, generadas de una combinación de 15x20 ──
    const APERTURAS = [
        'Después de ocho meses,',
        'Cuando me abrazas,',
        'Cada mañana que pienso en ti,',
        'Con cada beso tuyo,',
        'Cuando escucho tu risa,',
        'Contigo,',
        'A tu lado,',
        'Desde que estamos juntos,',
        'Cada vez que te veo,',
        'En cada mes que pasa,',
        'Aunque no lo diga siempre,',
        'Sin importar el día,',
        'Entre risas y silencios,',
        'Como los girasoles,',
        'En esta historia nuestra,',
    ];
    const CIERRES = [
        'sé que elegí bien.',
        'el tiempo se siente distinto.',
        'encuentro un motivo más para sonreír.',
        'aprendo que el amor también es paciencia.',
        'confirmo que eres mi lugar favorito.',
        'sigo agradecido de tenerte.',
        'las cosas simples se sienten especiales.',
        'me siento en casa.',
        'florezco un poco más.',
        'quiero seguir escribiendo capítulos contigo.',
        'todo lo demás pasa a segundo plano.',
        'mi corazón late un poquito más fuerte.',
        'entiendo por qué te quiero tanto.',
        'el mundo se vuelve más bonito.',
        'sé que lo mejor todavía está por venir.',
        'me dan ganas de quedarme para siempre.',
        'mis días tienen más color.',
        'le agradezco a la vida por cruzarnos.',
        'descubro una razón nueva para amarte.',
        'te vuelvo a elegir, negrita.',
    ];
    const FRASES = [];
    for (let i = 0; i < APERTURAS.length; i++) {
        for (let j = 0; j < CIERRES.length; j++) {
            FRASES.push(`${APERTURAS[i]} ${CIERRES[j]}`);
        }
    }

    function avisoCarga(texto) {
        if (!cargando) return;
        const span = cargando.querySelector('span:last-child');
        if (span) span.textContent = texto;
        cargando.classList.remove('oculto');
    }

    let mensajeAbierto = false;
    function mostrarMensajeGalaxia(texto) {
        if (!mensajeBox || !mensajeTxt) return;
        mensajeTxt.textContent = texto;
        mensajeBox.hidden = false;
        mensajeAbierto = true;
        burstHearts(4);
    }

    window.cerrarMensajeGalaxia = function () {
        if (mensajeBox) mensajeBox.hidden = true;
        mensajeAbierto = false;
    };
    mensajeBox?.addEventListener('click', (e) => { if (e.target === mensajeBox) window.cerrarMensajeGalaxia(); });

    // ── Carga diferida de scripts ──
    function cargarScript(src) {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            s.async = false;
            s.onload = resolve;
            s.onerror = () => { s.remove(); reject(new Error(src)); };
            document.head.appendChild(s);
        });
    }

    async function cargarDependencias() {
        if (typeof THREE === 'undefined') {
            try {
                await cargarScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
            } catch (e) {
                await cargarScript('https://unpkg.com/three@0.128.0/build/three.min.js');
            }
        }
        // Estas dos son opcionales: si fallan se usan estrellas 2D
        try {
            if (typeof THREE.GLTFLoader !== 'function') {
                await cargarScript('https://unpkg.com/three@0.128.0/examples/js/loaders/GLTFLoader.js');
            }
            if (typeof window.ESTRELLA_MODELO_GLB_BASE64 !== 'string') {
                await cargarScript('JS/estrella-modelo-data.js?v=1');
            }
        } catch (e) { /* respaldo 2D */ }
    }

    // Todo lo de Three.js vive aquí adentro: solo se ejecuta cuando
    // la librería ya está cargada.
    function iniciarGalaxia() {
        let scene, camera, renderer, galaxyGroup;
        let W = contenedor.clientWidth, H = contenedor.clientHeight;
        let isDragging = false;
        let hasDraggedMuch = false;
        let lastX = 0, lastY = 0;
        // En celular (pantalla vertical) inclinamos más la galaxia para que
        // se vea redonda y llene el recuadro en vez de una franja plana.
        let rotX = (W / Math.max(H, 1)) < 1.15 ? 0.62 : 0.15, rotY = 0;
        let autoRotate = true;
        let zoomManual = false;
        let reanudarTimer = null;
        const stars = [];
        let instancias = null; // { meshes: [InstancedMesh], offsets: [Matrix4] }

        // Galaxia más grande para que las 300 estrellas respiren
        const RADIO_MIN   = 6;
        const RADIO_EXTRA = 46;
        const Z_MIN = 30, Z_MAX = 160;

        function posicionAleatoria() {
            const radius = RADIO_MIN + Math.random() * RADIO_EXTRA;
            const angle  = Math.random() * Math.PI * 2 + radius * 0.13;
            const alt    = (Math.random() - 0.5) * 9 * (1 - radius / (RADIO_MIN + RADIO_EXTRA + 4));
            return new THREE.Vector3(radius * Math.cos(angle), alt, radius * Math.sin(angle));
        }

        // Estrella "power star" (tipo Mario 64): 5 puntas, carita con ojos grandes
        function crearTexturaEstrella() {
            const size = 256;
            const mid  = size / 2;
            const c = document.createElement('canvas');
            c.width = c.height = size;
            const ctx = c.getContext('2d');

            const outerR = size * 0.44;
            const innerR = outerR * 0.42;

            ctx.save();
            ctx.translate(mid, mid);

            // Sombra suave detrás de la estrella para que resalte del cielo
            ctx.shadowColor = 'rgba(120,70,0,0.55)';
            ctx.shadowBlur = size * 0.05;

            // Silueta de 5 puntas
            ctx.beginPath();
            for (let i = 0; i < 10; i++) {
                const r = i % 2 === 0 ? outerR : innerR;
                const a = -Math.PI / 2 + i * Math.PI / 5;
                const x = r * Math.cos(a), y = r * Math.sin(a);
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.closePath();

            const relleno = ctx.createRadialGradient(0, -outerR * 0.1, outerR * 0.08, 0, 0, outerR);
            relleno.addColorStop(0,    '#fff6c2');
            relleno.addColorStop(0.5,  '#ffd93b');
            relleno.addColorStop(1,    '#f7a300');
            ctx.fillStyle = relleno;
            ctx.fill();

            ctx.shadowColor = 'transparent';
            ctx.lineWidth = outerR * 0.075;
            ctx.strokeStyle = '#8a4d00';
            ctx.stroke();

            // Ojos grandes y traviesos, mirando hacia un lado (como el Power Star)
            const eyeCx = outerR * 0.24;
            const eyeCy = -outerR * 0.06;
            const eyeW  = outerR * 0.34;
            const eyeH  = outerR * 0.4;

            [-1, 1].forEach((dir) => {
                ctx.save();
                ctx.translate(dir * eyeCx, eyeCy);
                ctx.rotate(dir * 0.15);

                // blanco del ojo
                ctx.beginPath();
                ctx.ellipse(0, 0, eyeW / 2, eyeH / 2, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#fffdf5';
                ctx.fill();
                ctx.lineWidth = outerR * 0.028;
                ctx.strokeStyle = '#5c3200';
                ctx.stroke();

                // pupila mirando hacia afuera y arriba (viveza tipo Mario)
                ctx.beginPath();
                ctx.arc(dir * eyeW * 0.16, -eyeH * 0.06, eyeW * 0.24, 0, Math.PI * 2);
                ctx.fillStyle = '#241300';
                ctx.fill();

                // brillito
                ctx.beginPath();
                ctx.arc(dir * eyeW * 0.16 - dir * eyeW * 0.11, -eyeH * 0.06 - eyeH * 0.14, eyeW * 0.08, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();

                ctx.restore();
            });

            // Cachetitos sonrosados
            [-1, 1].forEach((dir) => {
                ctx.beginPath();
                ctx.ellipse(dir * outerR * 0.34, outerR * 0.2, outerR * 0.09, outerR * 0.06, 0, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,140,140,0.35)';
                ctx.fill();
            });

            // Sonrisita
            ctx.beginPath();
            ctx.arc(0, outerR * 0.14, outerR * 0.16, 0.12 * Math.PI, 0.88 * Math.PI);
            ctx.lineWidth = outerR * 0.05;
            ctx.strokeStyle = '#5c3200';
            ctx.lineCap = 'round';
            ctx.stroke();

            ctx.restore();

            const tex = new THREE.CanvasTexture(c);
            tex.needsUpdate = true;
            return tex;
        }

        // ── Respaldo: estrellas dibujadas en canvas 2D (si el modelo 3D falla) ──
        function construirEstrellasConSprite() {
            const starTex = crearTexturaEstrella();
            for (let i = 0; i < FRASES.length; i++) {
                const color = new THREE.Color(0xffffff).lerp(new THREE.Color(0xfff0b8), Math.random());
                const mat = new THREE.SpriteMaterial({ map: starTex, color, transparent: true, opacity: 1, depthWrite: false });
                const star = new THREE.Sprite(mat);
                star.position.copy(posicionAleatoria());
                star.userData.frase = FRASES[i];
                star.userData.phase = Math.random() * Math.PI * 2;
                star.userData.tipo = 'sprite';
                star.userData.baseScale = 1.7 + Math.random() * 1.2;
                star.scale.set(star.userData.baseScale, star.userData.baseScale, 1);
                galaxyGroup.add(star);
                stars.push(star);
            }
        }

        // ── Estrellas con el modelo 3D real, usando InstancedMesh ──
        function construirEstrellasConModelo(plantilla) {
            plantilla.updateMatrixWorld(true);
            const caja = new THREE.Box3().setFromObject(plantilla);
            const centro = caja.getCenter(new THREE.Vector3());
            const tam = caja.getSize(new THREE.Vector3());
            const dimensionMax = Math.max(tam.x, tam.y, tam.z) || 1;
            const escalaBase = 2.8 / dimensionMax;

            const piezas = [];
            plantilla.traverse((o) => { if (o.isMesh) piezas.push(o); });
            if (!piezas.length) throw new Error('modelo sin mallas');

            const N = FRASES.length;
            const aCentro = new THREE.Matrix4().makeTranslation(-centro.x, -centro.y, -centro.z);
            const meshes = [], offsets = [];

            piezas.forEach((pieza) => {
                const mat = Array.isArray(pieza.material) ? pieza.material[0] : pieza.material;
                const inst = new THREE.InstancedMesh(pieza.geometry, mat, N);
                inst.frustumCulled = false; // la esfera de recorte no cubre las instancias
                inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
                meshes.push(inst);
                offsets.push(new THREE.Matrix4().multiplyMatrices(aCentro, pieza.matrixWorld));
                galaxyGroup.add(inst);
            });

            const blanco = new THREE.Color(0xffffff), dorado = new THREE.Color(0xfff0b8);
            for (let i = 0; i < N; i++) {
                const tinte = blanco.clone().lerp(dorado, Math.random() * 0.6);
                meshes.forEach(m => { if (m.setColorAt) m.setColorAt(i, tinte); });
                stars.push({
                    position: posicionAleatoria(),
                    userData: {
                        frase: FRASES[i],
                        phase: Math.random() * Math.PI * 2,
                        tipo: 'instancia',
                        spinAngle: Math.random() * Math.PI * 2,
                        spinSpeed: 0.004 + Math.random() * 0.008,
                        baseScale: escalaBase * (0.85 + Math.random() * 0.55),
                    },
                });
            }
            meshes.forEach(m => { if (m.instanceColor) m.instanceColor.needsUpdate = true; });

            instancias = { meshes, offsets, dummy: new THREE.Object3D(), tmp: new THREE.Matrix4() };
            galaxyGroup.add(instancias.dummy);
        }

        function base64AArrayBuffer(base64) {
            const binario = atob(base64);
            const bytes = new Uint8Array(binario.length);
            for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
            return bytes.buffer;
        }

        function cargarEstrellas() {
            const ocultarCarga = () => { if (cargando) cargando.classList.add('oculto'); };
            const respaldo = () => {
                // limpia cualquier intento a medias antes de usar el 2D
                if (instancias) { instancias.meshes.forEach(m => galaxyGroup.remove(m)); instancias = null; }
                stars.length = 0;
                construirEstrellasConSprite();
                ocultarCarga();
            };

            if (typeof THREE.GLTFLoader !== 'function' || typeof window.ESTRELLA_MODELO_GLB_BASE64 !== 'string') {
                respaldo();
                return;
            }
            try {
                const buffer = base64AArrayBuffer(window.ESTRELLA_MODELO_GLB_BASE64);
                new THREE.GLTFLoader().parse(buffer, '', (gltf) => {
                    try { construirEstrellasConModelo(gltf.scene); ocultarCarga(); }
                    catch (err) { respaldo(); }
                }, respaldo);
            } catch (err) {
                respaldo();
            }
        }

        function distanciaIdeal() {
            // En pantallas angostas (celular) la cámara se aleja un poco
            // para que la galaxia completa quepa a lo ancho.
            const aspecto = W / Math.max(H, 1);
            return 96 * clamp(1.3 / aspecto, 1, 1.18);
        }

        function initScene() {
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 1000);
            camera.position.set(0, 18, distanciaIdeal());
            camera.lookAt(0, 0, 0);

            renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile(), alpha: true, powerPreference: 'high-performance' });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile() ? 1.5 : 2));
            renderer.setSize(W, H, false);

            galaxyGroup = new THREE.Group();
            scene.add(galaxyGroup);

            scene.add(new THREE.AmbientLight(0xfff2c9, 0.9));
            const luzDireccional = new THREE.DirectionalLight(0xffffff, 1.1);
            luzDireccional.position.set(15, 25, 20);
            scene.add(luzDireccional);
            const luzCalida = new THREE.PointLight(0xffd27a, 0.6, 200);
            luzCalida.position.set(-20, -10, 30);
            scene.add(luzCalida);

            galaxyGroup.rotation.x = rotX;
        }

        function resize() {
            const nw = contenedor.clientWidth, nh = contenedor.clientHeight;
            if (!nw || !nh || !renderer) return;
            if (nw === W && nh === H) return;
            W = nw; H = nh;
            camera.aspect = W / H;
            camera.updateProjectionMatrix();
            renderer.setSize(W, H, false);
            if (!zoomManual) camera.position.z = distanciaIdeal();
        }
        window.addEventListener('resize', resize, { passive: true });
        window.addEventListener('orientationchange', () => setTimeout(resize, 250));

        // ── Tocar una estrella ──
        const _vecProy = new THREE.Vector3();

        function proyectarAPixeles(star, rect) {
            _vecProy.copy(star.position);
            _vecProy.applyMatrix4(galaxyGroup.matrixWorld);
            _vecProy.project(camera);
            return {
                x: (_vecProy.x * 0.5 + 0.5) * rect.width + rect.left,
                y: (-_vecProy.y * 0.5 + 0.5) * rect.height + rect.top,
                detrasCamara: _vecProy.z > 1,
            };
        }

        function encontrarEstrellaCercana(clientX, clientY, umbral) {
            const rect = canvas.getBoundingClientRect();
            galaxyGroup.updateMatrixWorld();
            let mejor = null, mejorDist = Infinity;
            stars.forEach(star => {
                const p = proyectarAPixeles(star, rect);
                if (p.detrasCamara) return;
                const d = Math.hypot(p.x - clientX, p.y - clientY);
                if (d < mejorDist) { mejorDist = d; mejor = star; }
            });
            return mejorDist <= umbral ? mejor : null;
        }

        // ── Gestos: 1 dedo gira, 2 dedos hacen zoom (pellizco) ──
        const activePointers = new Map();
        let pinchDistInicial = null;
        let pinchZInicial = null;
        let tipoPuntero = 'mouse';

        const distanciaEntre = (p1, p2) => Math.hypot(p2.x - p1.x, p2.y - p1.y);

        function pausarAutoGiro() {
            autoRotate = false;
            clearTimeout(reanudarTimer);
        }
        function reanudarAutoGiro() {
            clearTimeout(reanudarTimer);
            reanudarTimer = setTimeout(() => { autoRotate = true; }, 2200);
        }

        function onPointerDown(e) {
            if (mensajeAbierto) return;
            tipoPuntero = e.pointerType || 'mouse';
            activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
            pausarAutoGiro();

            if (activePointers.size === 1) {
                isDragging = true;
                hasDraggedMuch = false;
                lastX = e.clientX; lastY = e.clientY;
            } else if (activePointers.size === 2) {
                isDragging = false;
                hasDraggedMuch = true;
                const [p1, p2] = Array.from(activePointers.values());
                pinchDistInicial = distanciaEntre(p1, p2);
                pinchZInicial = camera.position.z;
            }
        }

        function onPointerMove(e) {
            if (!activePointers.has(e.pointerId)) return;
            activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

            if (activePointers.size >= 2) {
                e.preventDefault();
                const [p1, p2] = Array.from(activePointers.values());
                const distActual = distanciaEntre(p1, p2);
                if (pinchDistInicial && distActual > 0) {
                    camera.position.z = clamp(pinchZInicial * (pinchDistInicial / distActual), Z_MIN, Z_MAX);
                    zoomManual = true;
                }
                return;
            }

            if (!isDragging) return;
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            // Un dedo siempre tiembla un poco: con tolerancia mayor en
            // pantallas táctiles, un toque no se confunde con un arrastre.
            const tolerancia = tipoPuntero === 'touch' ? 10 : 4;
            if (!hasDraggedMuch) {
                if (Math.abs(dx) < tolerancia && Math.abs(dy) < tolerancia) return;
                hasDraggedMuch = true;
            }
            rotY += dx * 0.006;
            rotX = clamp(rotX + dy * 0.006, -1.1, 1.1);
            lastX = e.clientX; lastY = e.clientY;
            e.preventDefault();
        }

        function finalizarPuntero(e, cancelado) {
            if (!activePointers.has(e.pointerId)) return;
            const estabaArrastrando = isDragging;
            activePointers.delete(e.pointerId);

            if (activePointers.size >= 2) {
                const [p1, p2] = Array.from(activePointers.values());
                pinchDistInicial = distanciaEntre(p1, p2);
                pinchZInicial = camera.position.z;
                return;
            }
            if (activePointers.size === 1) {
                const restante = Array.from(activePointers.values())[0];
                lastX = restante.x; lastY = restante.y;
                isDragging = true;
                hasDraggedMuch = true;
                pinchDistInicial = null;
                return;
            }

            pinchDistInicial = null;
            isDragging = false;
            reanudarAutoGiro();
            if (!estabaArrastrando || cancelado) return;

            if (!hasDraggedMuch) {
                const umbral = tipoPuntero === 'touch' ? 40 : 26;
                const estrella = encontrarEstrellaCercana(e.clientX, e.clientY, umbral);
                if (estrella) mostrarMensajeGalaxia(estrella.userData.frase);
            }
        }

        canvas.addEventListener('pointerdown', onPointerDown);
        canvas.addEventListener('pointermove', onPointerMove);
        canvas.addEventListener('pointerup', (e) => finalizarPuntero(e, false));
        canvas.addEventListener('pointercancel', (e) => finalizarPuntero(e, true));
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            camera.position.z = clamp(camera.position.z + e.deltaY * 0.04, Z_MIN, Z_MAX);
            zoomManual = true;
        }, { passive: false });

        // Botones + / − (más fácil que pellizcar en algunos celulares)
        $$('.galaxia-zoom button', contenedor).forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const paso = btn.dataset.zoom === 'in' ? -14 : 14;
                camera.position.z = clamp(camera.position.z + paso, Z_MIN, Z_MAX);
                zoomManual = true;
            });
        });

        // ── Animación (se pausa cuando la galaxia no está en pantalla) ──
        let visible = true;
        let corriendo = false;
        let t = 0;

        function animate() {
            if (!visible || document.hidden) { corriendo = false; return; }
            requestAnimationFrame(animate);
            t += 0.016;
            if (autoRotate && !isDragging) rotY += 0.0015;
            galaxyGroup.rotation.y = rotY;
            galaxyGroup.rotation.x = rotX;
            galaxyGroup.updateMatrixWorld();

            if (instancias) {
                const { meshes, offsets, dummy, tmp } = instancias;
                for (let i = 0; i < stars.length; i++) {
                    const ud = stars[i].userData;
                    const twinkle = 0.75 + 0.25 * Math.sin(t * 1.4 + ud.phase);
                    ud.spinAngle += ud.spinSpeed;
                    dummy.position.copy(stars[i].position);
                    dummy.lookAt(camera.position);   // la carita siempre mira a la cámara
                    dummy.rotateZ(ud.spinAngle);     // giro tipo molinillo
                    dummy.scale.setScalar(ud.baseScale * (0.94 + 0.06 * twinkle));
                    dummy.updateMatrix();
                    for (let k = 0; k < meshes.length; k++) {
                        tmp.multiplyMatrices(dummy.matrix, offsets[k]);
                        meshes[k].setMatrixAt(i, tmp);
                    }
                }
                meshes.forEach(m => { m.instanceMatrix.needsUpdate = true; });
            } else {
                stars.forEach(star => {
                    const twinkle = 0.75 + 0.25 * Math.sin(t * 1.4 + star.userData.phase);
                    star.material.opacity = twinkle;
                    star.scale.setScalar(star.userData.baseScale * (0.9 + 0.1 * twinkle));
                });
            }

            renderer.render(scene, camera);
        }

        function arrancar() {
            if (corriendo) return;
            corriendo = true;
            requestAnimationFrame(animate);
        }

        if ('IntersectionObserver' in window) {
            new IntersectionObserver((entries) => {
                visible = entries[0].isIntersecting;
                if (visible) arrancar();
            }, { threshold: 0 }).observe(contenedor);
        }
        document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) arrancar(); });

        initScene();
        cargarEstrellas();
        arrancar();
    }

    let booted = false;
    async function boot() {
        if (booted) return;
        booted = true;
        try {
            await cargarDependencias();
        } catch (err) {
            avisoCarga('No se pudo cargar la galaxia (revisa tu conexión).');
            return;
        }
        try {
            iniciarGalaxia();
        } catch (err) {
            avisoCarga('No se pudo mostrar la galaxia en este dispositivo.');
        }
    }

    // Empieza a descargar un poco antes de que ella llegue a la sección
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            if (entries.some(en => en.isIntersecting)) { io.disconnect(); boot(); }
        }, { rootMargin: '700px 0px' });
        io.observe(contenedor);
    } else {
        boot();
    }
})();
