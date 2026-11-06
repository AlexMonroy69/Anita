'use strict';

/* Girasol ASCII que florece: tallo -> hojas -> pétalos -> semillas. */
(() => {
    const COLS = 72;
    const ROWS = 46;
    const TOTAL_MS = 9500;
    const HEAD = { col: 36, row: 15 };
    const GROUND_ROW = ROWS - 4;
    const DISK_R = 7.5;
    const PETAL_LEN = 9.5;
    const PETALS = 17;
    const MAX_SEEDS = 150;
    const GOLDEN = Math.PI * (3 - Math.sqrt(5));
    const PHASES = {
        stem: [0, 0.28],
        leaves: [0.18, 0.45],
        petals: [0.38, 0.85],
        seeds: [0.5, 1],
    };

    const canvas = document.getElementById('girasol-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let metrics = { font: 14, cw: 8.4, ch: 14.7, aspect: 1.75 };
    let startTime = null;
    let visible = false;
    let frame = 0;

    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const phase = (t, [a, b]) => clamp((t - a) / (b - a));
    const easeOut = (x) => 1 - Math.pow(1 - x, 3);
    const easeBack = (x) => 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2);
    const lerp = (a, b, k) => a + (b - a) * k;
    const mix = (c1, c2, k) => `rgb(${c1.map((v, i) => Math.round(lerp(v, c2[i], k))).join(',')})`;

    function seeded(seed) {
        let s = seed;
        return () => {
            s = (s * 16807) % 2147483647;
            return (s - 1) / 2147483646;
        };
    }

    const rand = seeded(2208);
    const STARS = Array.from({ length: 95 }, () => ({
        col: Math.floor(rand() * COLS),
        row: Math.floor(rand() * (GROUND_ROW - 1)),
        speed: 0.6 + rand() * 1.8,
        offset: rand() * Math.PI * 2,
    }));
    const GRASS = Array.from({ length: COLS }, (_, c) => ({
        ch: ",.'\"`;"[Math.floor(rand() * 6)],
        on: Math.abs(c - HEAD.col) < 20 + rand() * 6,
        g: 110 + Math.floor(rand() * 90),
    }));
    const PETAL_ORDER = Array.from({ length: PETALS }, (_, i) => (i * 8) % PETALS);

    /* ---------- grid ---------- */

    function createGrid() {
        return { chars: new Array(COLS * ROWS).fill(' '), colors: new Array(COLS * ROWS).fill('') };
    }

    function plot(grid, col, row, ch, color) {
        const c = Math.round(col);
        const r = Math.round(row);
        if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return;
        grid.chars[r * COLS + c] = ch;
        grid.colors[r * COLS + c] = color;
    }

    function swayAt(row, sway) {
        const k = clamp((GROUND_ROW - row) / (GROUND_ROW - HEAD.row));
        return sway * k * k;
    }

    /* ---------- partes de la flor ---------- */

    function drawStem(grid, p, sway) {
        // el tallo crece desde la tierra hasta la cabeza
        const height = GROUND_ROW - HEAD.row;
        const top = GROUND_ROW - height * easeOut(p);
        for (let row = GROUND_ROW; row >= top; row--) {
            const k = (GROUND_ROW - row) / height;
            const bend = 1.6 * Math.sin(k * Math.PI);
            const slope = 1.6 * Math.PI * Math.cos(k * Math.PI) / height;
            const col = HEAD.col + bend + swayAt(row, sway);
            const ch = Math.abs(slope) < 0.04 ? '|' : slope > 0 ? '\\' : '/';
            plot(grid, col, row, ch, '#4caf50');
            plot(grid, col + 1, row, ':', '#2e7d32');
        }
    }

    function drawLeaf(grid, leaf, p, sway) {
        // hoja = elipse puntiaguda que se abre desde el tallo
        const len = leaf.len * easeBack(p);
        if (len <= 0.2) return;
        const baseCol = HEAD.col + 1.6 * Math.sin(((GROUND_ROW - leaf.row) / (GROUND_ROW - HEAD.row)) * Math.PI);
        const ox = baseCol + swayAt(leaf.row, sway) + (leaf.dir > 0 ? 1 : 0);
        const cos = Math.cos(leaf.angle);
        const sin = Math.sin(leaf.angle);
        const span = Math.ceil(len) + 1;
        for (let dr = -span; dr <= span; dr++) {
            for (let dc = -span; dc <= span; dc++) {
                const dx = dc;
                const dy = dr * metrics.aspect;
                const u = dx * cos + dy * sin;
                const v = -dx * sin + dy * cos;
                const hw = len * 0.36 * Math.pow(Math.sin(Math.PI * clamp(u / len)), 0.8);
                if (u < 0 || u > len || Math.abs(v) > hw) continue;
                const edge = Math.abs(v) / (hw || 1);
                const ch = edge < 0.2 ? '-' : edge > 0.75 ? '.' : '%#*+;'[Math.floor((u / len) * 4.99)];
                const color = edge < 0.2 ? '#a5d6a7' : mix([46, 125, 50], [129, 199, 132], u / len);
                plot(grid, ox + dc, leaf.row + dr, ch, color);
            }
        }
    }

    function petalHit(r, theta, layer, opens, spin) {
        const step = (Math.PI * 2) / PETALS;
        const offset = layer.offset * step + spin;
        const j = ((Math.round((theta - offset) / step) % PETALS) + PETALS) % PETALS;
        const s = opens[j];
        if (s <= 0.02) return null;
        const d = Math.atan2(Math.sin(theta - offset - j * step), Math.cos(theta - offset - j * step));
        const len = PETAL_LEN * layer.len * s;
        const u = (r - DISK_R + 0.8) / len;
        if (u < 0 || u > 1) return null;
        const hw = 1.75 * s * Math.pow(Math.sin(Math.PI * u), 0.55) * (1 - 0.3 * u);
        const dist = Math.abs(d) * r;
        return dist < hw ? { u, edge: dist / hw } : null;
    }

    function drawPetals(grid, p, sway, time) {
        // cada pétalo se abre con un pequeño retraso
        const opens = PETAL_ORDER.map((order) => easeBack(clamp((p - (order / PETALS) * 0.55) / 0.45)));
        const spin = sway * 0.03 + Math.sin(time / 2600) * 0.02;
        const layers = [
            { offset: 0.5, len: 0.72, base: [150, 70, 12], tip: [205, 120, 25] },
            { offset: 0, len: 1, base: [255, 152, 20], tip: [255, 230, 90] },
        ];
        const cx = HEAD.col + sway;
        const reach = Math.ceil(DISK_R + PETAL_LEN + 1);
        for (const layer of layers) {
            for (let dr = -Math.ceil(reach / metrics.aspect); dr <= reach / metrics.aspect; dr++) {
                for (let dc = -reach; dc <= reach; dc++) {
                    const dy = dr * metrics.aspect;
                    const r = Math.hypot(dc, dy);
                    if (r < DISK_R - 0.5 || r > reach) continue;
                    const hit = petalHit(r, Math.atan2(dy, dc), layer, opens, spin);
                    if (!hit) continue;
                    const ch = hit.edge > 0.78 ? '.' : '@%*+'[Math.min(3, Math.floor(hit.u * 4))];
                    plot(grid, cx + dc, HEAD.row + dr, ch, mix(layer.base, layer.tip, hit.u));
                }
            }
        }
    }

    function drawDisk(grid, pPetals, pSeeds, sway) {
        // el centro: espiral de Fibonacci con 137.5° entre semillas
        const radius = DISK_R * easeOut(clamp(pPetals * 2.2));
        if (radius <= 0.3) return;
        const cx = HEAD.col + sway;
        const rows = Math.ceil(radius / metrics.aspect);
        for (let dr = -rows; dr <= rows; dr++) {
            for (let dc = -Math.ceil(radius); dc <= radius; dc++) {
                const r = Math.hypot(dc, dr * metrics.aspect);
                if (r > radius) continue;
                const ring = r > radius - 1.1;
                plot(grid, cx + dc, HEAD.row + dr, ring ? '#' : '.', ring ? '#7a4416' : '#3e2410');
            }
        }
        const count = Math.floor(easeOut(pSeeds) * MAX_SEEDS);
        const c = (DISK_R - 1.2) / Math.sqrt(MAX_SEEDS);
        for (let k = count; k >= 1; k--) {
            const r = c * Math.sqrt(k);
            const a = k * GOLDEN;
            const fresh = count - k < 6 && pSeeds < 1;
            const color = fresh ? '#ffd166' : mix([110, 55, 15], [196, 112, 32], r / DISK_R);
            plot(grid, cx + r * Math.cos(a), HEAD.row + (r * Math.sin(a)) / metrics.aspect, 'o@0'[k % 3], color);
        }
    }

    function drawSky(grid, time) {
        for (const star of STARS) {
            const b = 0.5 + 0.5 * Math.sin((time / 1000) * star.speed + star.offset);
            const ch = b > 0.85 ? '*' : b > 0.5 ? '+' : '.';
            plot(grid, star.col, star.row, ch, `rgba(255,244,214,${(0.15 + b * 0.55).toFixed(2)})`);
        }
        GRASS.forEach((g, c) => {
            if (g.on) plot(grid, c, GROUND_ROW + 1, g.ch, `rgb(60,${g.g},70)`);
        });
    }

    function drawSparkles(grid, p, time, sway) {
        if (p <= 0) return;
        for (let k = 0; k < 16; k++) {
            const life = ((time / 1000) * 0.35 + k * 0.173) % 1;
            const angle = k * 2.4 + Math.sin(k) * 0.5;
            const dist = DISK_R + PETAL_LEN * 0.7 + life * 9;
            const alpha = (Math.sin(life * Math.PI) * p).toFixed(2);
            const col = HEAD.col + sway + Math.cos(angle) * dist;
            const row = HEAD.row + (Math.sin(angle) * dist) / metrics.aspect - life * 3;
            plot(grid, col, row, life < 0.5 ? '*' : '+', `rgba(255,215,90,${alpha})`);
        }
    }

    /* ---------- render ---------- */

    function render(now) {
        if (startTime === null) startTime = now;
        const elapsed = reduceMotion ? TOTAL_MS : now - startTime;
        const t = clamp(elapsed / TOTAL_MS);
        const sway = 0; // al terminar, el girasol queda quieto y completo
        const grid = createGrid();

        drawSky(grid, now);
        drawStem(grid, phase(t, PHASES.stem), sway);
        const pLeaves = phase(t, PHASES.leaves);
        drawLeaf(grid, { row: GROUND_ROW - 9, dir: 1, angle: -0.42, len: 15 }, pLeaves, sway);
        drawLeaf(grid, { row: GROUND_ROW - 15, dir: -1, angle: Math.PI + 0.4, len: 13 }, clamp(pLeaves * 1.3 - 0.3), sway);
        drawPetals(grid, phase(t, PHASES.petals), sway, now);
        drawDisk(grid, phase(t, PHASES.petals), phase(t, PHASES.seeds), sway);
        drawSparkles(grid, Math.sin(phase(t, [0.7, 1]) * Math.PI), now, sway);

        paint(grid);
        frame = visible ? requestAnimationFrame(render) : 0;
    }

    function paint(grid) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = `${metrics.font}px ${FONT}`;
        ctx.textBaseline = 'top';
        for (let i = 0; i < grid.chars.length; i++) {
            if (grid.chars[i] === ' ') continue;
            ctx.fillStyle = grid.colors[i];
            ctx.fillText(grid.chars[i], (i % COLS) * metrics.cw, Math.floor(i / COLS) * metrics.ch);
        }
    }

    const FONT = "Consolas, 'Courier New', ui-monospace, monospace";

    function resize() {
        const avail = Math.min(canvas.parentElement.clientWidth, 640);
        const dpr = window.devicePixelRatio || 1;
        ctx.font = `100px ${FONT}`;
        const ratio = ctx.measureText('M').width / 100;
        const font = Math.max(6, Math.min(15, avail / (COLS * ratio)));
        const cw = font * ratio;
        const ch = font * 1.05;
        metrics = { font, cw, ch, aspect: ch / cw };
        canvas.style.width = `${COLS * cw}px`;
        canvas.style.height = `${ROWS * ch}px`;
        canvas.width = Math.round(COLS * cw * dpr);
        canvas.height = Math.round(ROWS * ch * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function replay() {
        startTime = performance.now();
    }

    // empieza a florecer cuando la sección aparece en pantalla
    const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !frame) frame = requestAnimationFrame(render);
    }, { threshold: 0.35 });

    window.addEventListener('resize', resize);
    canvas.addEventListener('click', replay);
    document.getElementById('girasol-repetir')?.addEventListener('click', () => {
        replay();
        if (!frame) frame = requestAnimationFrame(render);
    });
    resize();
    observer.observe(canvas);
})();
