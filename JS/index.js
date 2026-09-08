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

// ── BUZÓN: enviar mensaje por WhatsApp ────────
function enviarBuzon() {
    const campo = $('#buzon-texto');
    const texto = campo ? campo.value.trim() : '';

    if (!texto) {
        campo?.focus();
        alert('Escribe algo antes de enviarlo 🌻');
        return;
    }

    const numero  = '573117501963';
    const mensaje = encodeURIComponent(`💌 Mensaje desde nuestra página:\n\n${texto}`);
    window.open(`https://wa.me/${numero}?text=${mensaje}`, '_blank');

    burstHearts(8);
    if (campo) campo.value = '';
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

// ══════════════════════════════════════════════
// GALAXIA · 100 estrellas, 100 frases (Three.js)
// ══════════════════════════════════════════════
(function initGalaxia() {
    const contenedor = document.getElementById('galaxia-contenedor');
    const canvas      = document.getElementById('galaxia-canvas');
    const cargando    = document.getElementById('galaxia-cargando');
    const mensajeBox  = document.getElementById('galaxia-mensaje');
    const mensajeTxt  = document.getElementById('galaxia-mensaje-texto');
    if (!contenedor || !canvas) return;

    // ── 100 frases, generadas de una combinación de 10x10 ──
    const APERTURAS = [
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
    ];
    const FRASES = [];
    for (let i = 0; i < APERTURAS.length; i++) {
        for (let j = 0; j < CIERRES.length; j++) {
            FRASES.push(`${APERTURAS[i]} ${CIERRES[j]}`);
        }
    }

    function mostrarMensajeGalaxia(texto) {
        if (!mensajeBox || !mensajeTxt) return;
        mensajeTxt.textContent = texto;
        mensajeBox.hidden = false;
        burstHearts(4);
    }

    window.cerrarMensajeGalaxia = function () {
        if (mensajeBox) mensajeBox.hidden = true;
    };

    // Si Three.js no cargó (sin internet, CDN bloqueado, etc.) mostramos aviso simple
    if (typeof THREE === 'undefined') {
        if (cargando) {
            cargando.querySelector('span:last-child').textContent =
                'No se pudo cargar la galaxia (revisa tu conexión).';
        }
        return;
    }

    let scene, camera, renderer, galaxyGroup;
    let W = contenedor.clientWidth, H = contenedor.clientHeight;
    let isDragging = false;
    let hasDraggedMuch = false;
    let lastX = 0, lastY = 0;
    let rotX = 0.15, rotY = 0;
    let autoRotate = true;
    const stars = [];

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
            const radius = 6 + Math.random() * 32;
            const angle  = Math.random() * Math.PI * 2 + radius * 0.16;
            const alt    = (Math.random() - 0.5) * 7 * (1 - radius / 40);

            const tono   = Math.random();
            const color  = new THREE.Color().lerpColors(
                new THREE.Color(0xffffff), new THREE.Color(0xfff0b8), tono
            );
            const mat = new THREE.SpriteMaterial({
                map: starTex, color, transparent: true, opacity: 1,
                depthWrite: false,
            });
            const star = new THREE.Sprite(mat);

            star.position.set(radius * Math.cos(angle), alt, radius * Math.sin(angle));
            star.userData.frase = FRASES[i];
            star.userData.phase = Math.random() * Math.PI * 2;
            star.userData.tipo = 'sprite';
            star.userData.baseScale = 2.1 + Math.random() * 1.6;
            star.scale.set(star.userData.baseScale, star.userData.baseScale, 1);

            galaxyGroup.add(star);
            stars.push(star);
        }
    }

    // ── Estrellas hechas con el modelo 3D real (super_mario_star.glb) ──
    function construirEstrellasConModelo(plantilla) {
        const caja = new THREE.Box3().setFromObject(plantilla);
        const centro = caja.getCenter(new THREE.Vector3());
        const tam = caja.getSize(new THREE.Vector3());
        const dimensionMax = Math.max(tam.x, tam.y, tam.z) || 1;
        const escalaBase = 3.6 / dimensionMax; // tamaño objetivo en unidades del mundo

        for (let i = 0; i < FRASES.length; i++) {
            const radius = 6 + Math.random() * 32;
            const angle  = Math.random() * Math.PI * 2 + radius * 0.16;
            const alt    = (Math.random() - 0.5) * 7 * (1 - radius / 40);

            const clon = plantilla.clone(true);
            clon.traverse((o) => {
                if (o.isMesh && o.material) {
                    o.material = o.material.clone();
                    if (o.material.color) {
                        o.material.color.lerp(new THREE.Color(0xfff0b8), Math.random() * 0.3);
                    }
                }
            });
            clon.position.sub(centro); // centramos el pivote en el propio modelo

            const wrapper = new THREE.Group();
            wrapper.add(clon);
            wrapper.position.set(radius * Math.cos(angle), alt, radius * Math.sin(angle));

            // La carita (con los ojitos) debe seguir mirando hacia la cámara
            // sin importar cuánto gires la galaxia con el dedo/mouse — es un
            // "billboard" real: cada cuadro, en animate(), la estrella se
            // reorienta hacia la posición de la cámara (con star.lookAt),
            // y luego se le suma el giro tipo molinillo sobre ese mismo eje.
            wrapper.userData.spinAngle = Math.random() * Math.PI * 2;

            wrapper.userData.frase = FRASES[i];
            wrapper.userData.phase = Math.random() * Math.PI * 2;
            wrapper.userData.tipo = 'modelo';
            wrapper.userData.spinSpeed = 0.004 + Math.random() * 0.008;
            wrapper.userData.baseScale = escalaBase * (0.85 + Math.random() * 0.55);
            wrapper.scale.setScalar(wrapper.userData.baseScale);

            galaxyGroup.add(wrapper);
            stars.push(wrapper);
        }
    }

    // El modelo 3D viene incrustado en base64 (JS/estrella-modelo-data.js)
    // en vez de cargarse desde un archivo .glb aparte. Así funciona incluso
    // abriendo el sitio con doble clic (protocolo "file://"), donde el
    // navegador bloquea por seguridad que la página pida otros archivos
    // locales — con el modelo ya incrustado no hace falta pedir nada.
    function base64AArrayBuffer(base64) {
        const binario = atob(base64);
        const bytes = new Uint8Array(binario.length);
        for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
        return bytes.buffer;
    }

    // Carga el modelo 3D; si falla por cualquier motivo, cae al dibujo 2D.
    function cargarEstrellas() {
        const ocultarCarga = () => { if (cargando) cargando.classList.add('oculto'); };

        if (typeof THREE.GLTFLoader !== 'function' || typeof window.ESTRELLA_MODELO_GLB_BASE64 !== 'string') {
            construirEstrellasConSprite();
            ocultarCarga();
            return;
        }

        try {
            const buffer = base64AArrayBuffer(window.ESTRELLA_MODELO_GLB_BASE64);
            const loader = new THREE.GLTFLoader();
            loader.parse(
                buffer,
                '',
                (gltf) => {
                    try {
                        construirEstrellasConModelo(gltf.scene);
                    } catch (err) {
                        construirEstrellasConSprite();
                    }
                    ocultarCarga();
                },
                () => { construirEstrellasConSprite(); ocultarCarga(); }
            );
        } catch (err) {
            construirEstrellasConSprite();
            ocultarCarga();
        }
    }

    function initScene() {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 1000);
        camera.position.set(0, 10, 62);
        camera.lookAt(0, 0, 0);

        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(W, H);

        galaxyGroup = new THREE.Group();
        scene.add(galaxyGroup);

        // Luces: el modelo 3D de la estrella necesita luz para verse bien
        // (el dibujo 2D de respaldo no las usa, pero no le hacen daño).
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
        W = contenedor.clientWidth;
        H = contenedor.clientHeight;
        if (!W || !H || !renderer) return;
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
        renderer.setSize(W, H);
    }
    window.addEventListener('resize', resize, { passive: true });

    // Buscamos la estrella más cercana al punto donde se tocó, con un
    // margen de tolerancia generoso — así no hay que acertarle al pixel
    // exacto del destello para poder leer su mensaje.
    const _vecProy = new THREE.Vector3();
    const UMBRAL_CLIC_PX = 26;

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

    function encontrarEstrellaCercana(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        galaxyGroup.updateMatrixWorld();
        let mejor = null, mejorDist = Infinity;
        stars.forEach(star => {
            const p = proyectarAPixeles(star, rect);
            if (p.detrasCamara) return;
            const dx = p.x - clientX, dy = p.y - clientY;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < mejorDist) { mejorDist = d; mejor = star; }
        });
        return mejorDist <= UMBRAL_CLIC_PX ? mejor : null;
    }

    // Soporte multitáctil: un dedo rota la galaxia (como antes), dos dedos
    // hacen zoom con el clásico gesto de "pellizco" (pinch) en celular.
    const activePointers = new Map(); // pointerId -> {x, y}
    let pinchDistInicial = null;
    let pinchZInicial = null;

    function distanciaEntre(p1, p2) {
        return Math.hypot(p2.x - p1.x, p2.y - p1.y);
    }

    function onPointerDown(e) {
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
        autoRotate = false;

        if (activePointers.size === 1) {
            isDragging = true;
            hasDraggedMuch = false;
            lastX = e.clientX; lastY = e.clientY;
        } else if (activePointers.size === 2) {
            isDragging = false;
            hasDraggedMuch = true; // dos dedos nunca cuentan como "tocar una estrella"
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
                const factor = pinchDistInicial / distActual;
                camera.position.z = clamp(pinchZInicial * factor, 30, 110);
            }
            return;
        }

        if (!isDragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDraggedMuch = true;
        rotY += dx * 0.006;
        rotX = clamp(rotX + dy * 0.006, -1.1, 1.1);
        lastX = e.clientX; lastY = e.clientY;
        e.preventDefault();
    }

    function finalizarPuntero(e) {
        const estabaArrastrando = isDragging;
        activePointers.delete(e.pointerId);

        if (activePointers.size >= 2) {
            // seguimos con al menos dos dedos: reiniciamos referencia de pellizco
            const [p1, p2] = Array.from(activePointers.values());
            pinchDistInicial = distanciaEntre(p1, p2);
            pinchZInicial = camera.position.z;
            return;
        }

        if (activePointers.size === 1) {
            // quedó un dedo: retomamos el arrastre normal desde ahí, sin
            // disparar el clic de "seleccionar estrella"
            const restante = Array.from(activePointers.values())[0];
            lastX = restante.x; lastY = restante.y;
            isDragging = true;
            hasDraggedMuch = true;
            pinchDistInicial = null;
            return;
        }

        // no quedan dedos/puntero sobre el lienzo
        pinchDistInicial = null;
        if (!estabaArrastrando) return;
        isDragging = false;
        setTimeout(() => { autoRotate = true; }, 2200);

        if (!hasDraggedMuch) {
            const estrella = encontrarEstrellaCercana(e.clientX, e.clientY);
            if (estrella) mostrarMensajeGalaxia(estrella.userData.frase);
        }
    }

    function onPointerUp(e) { finalizarPuntero(e); }
    function onPointerCancel(e) { finalizarPuntero(e); }

    function onWheel(e) {
        e.preventDefault();
        camera.position.z = clamp(camera.position.z + e.deltaY * 0.04, 30, 110);
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerCancel);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    let started = false;
    function startAnimation() {
        if (started) return;
        started = true;
        let t = 0;
        function animate() {
            requestAnimationFrame(animate);
            t += 0.016;
            if (autoRotate && !isDragging) rotY += 0.0015;
            galaxyGroup.rotation.y = rotY;
            galaxyGroup.rotation.x = rotX;

            stars.forEach(star => {
                const twinkle = 0.75 + 0.25 * Math.sin(t * 1.4 + star.userData.phase);
                if (star.userData.tipo === 'modelo') {
                    // Billboard real: la estrella siempre queda mirando de
                    // frente hacia la cámara, gires como gires la galaxia,
                    // y le sumamos un giro tipo molinillo sobre ese eje.
                    star.userData.spinAngle += star.userData.spinSpeed;
                    star.lookAt(camera.position);
                    star.rotateZ(star.userData.spinAngle);
                    star.scale.setScalar(star.userData.baseScale * (0.94 + 0.06 * twinkle));
                } else {
                    star.material.opacity = twinkle;
                    star.scale.setScalar(star.userData.baseScale * (0.9 + 0.1 * twinkle));
                }
            });

            renderer.render(scene, camera);
        }
        animate();
    }

    // Solo inicializamos cuando la sección entra en pantalla (ahorra recursos)
    let booted = false;
    function boot() {
        if (booted) return;
        booted = true;
        try {
            initScene();
            resize();
            startAnimation();
            cargarEstrellas();
        } catch (err) {
            if (cargando) cargando.querySelector('span:last-child').textContent =
                'No se pudo mostrar la galaxia en este dispositivo.';
        }
    }

    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => { if (entry.isIntersecting) { boot(); io.disconnect(); } });
        }, { threshold: 0.15 });
        io.observe(contenedor);
    } else {
        boot();
    }
})();
