'use strict';

/*
 * Intro de la galaxia: las mismas 300 estrellas llegan desde el fondo,
 * forman un corazón, se transforman en un girasol y explotan hasta quedar
 * en su lugar de la galaxia (cada una con su frase).
 * No cambia el diseño de las estrellas: solo mueve, escala y tiñe un poco.
 */
(() => {
    const T = {
        llegada: [0, 2.8],
        latido: [2.8, 4.6],
        girasol: [4.6, 6.8],
        pausa: [6.8, 8.4],
        contraer: [8.4, 8.8],
        explosion: [8.8, 11.4],
    };
    const FIN = T.explosion[1];
    const GOLDEN = Math.PI * (3 - Math.sqrt(5));

    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const tramo = (s, [a, b]) => clamp((s - a) / (b - a));
    const easeOut = (x) => 1 - Math.pow(1 - x, 3);
    const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

    function aleatorio(semilla) {
        let s = semilla;
        return () => {
            s = (s * 16807) % 2147483647;
            return (s - 1) / 2147483646;
        };
    }

    /* ---------- formas (plano XY, mirando a la cámara) ---------- */

    function puntoCorazon(t) {
        return {
            x: 16 * Math.pow(Math.sin(t), 3),
            y: 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t),
        };
    }

    function formaCorazon(THREE, total, rnd) {
        const S = 1.75;
        const borde = Math.round(total * 0.42);
        return Array.from({ length: total }, (_, i) => {
            const enBorde = i < borde;
            const t = enBorde ? (i / borde) * Math.PI * 2 : rnd() * Math.PI * 2;
            const p = puntoCorazon(t);
            const f = enBorde ? 1 : Math.sqrt(rnd()) * 0.9;
            const cy = -2;
            return {
                pos: new THREE.Vector3(p.x * f * S, (cy + (p.y - cy) * f) * S + 6, (rnd() - 0.5) * 3),
                color: new THREE.Color(enBorde ? 0xff4d8d : 0xff86b3),
                escala: enBorde ? 0.72 : 0.62,
            };
        });
    }

    function puntosPetalos(THREE, C) {
        const lista = [];
        const PETALOS = 16;
        const centro = [0, 0.25, 0.5, 0.75, 1].map((u) => ({ u, lado: 0 }));
        const lados = [0.35, 0.65].flatMap((u) => [{ u, lado: -1 }, { u, lado: 1 }]);
        for (let p = 0; p < PETALOS; p++) {
            const a = (p / PETALOS) * Math.PI * 2;
            for (const { u, lado } of [...centro, ...lados]) {
                const r = 11.5 + u * 14;
                const ancho = lado * 2.1 * Math.sin(Math.PI * u);
                lista.push({
                    pos: new THREE.Vector3(
                        C.x + r * Math.cos(a) - ancho * Math.sin(a),
                        C.y + r * Math.sin(a) + ancho * Math.cos(a),
                        0,
                    ),
                    color: new THREE.Color(u > 0.6 ? 0xffe066 : 0xffb627),
                    escala: 0.68,
                });
            }
        }
        return lista;
    }

    function puntosTalloYHojas(THREE, C) {
        const lista = [];
        const TALLO = 32;
        for (let k = 0; k < TALLO; k++) {
            const u = k / (TALLO - 1);
            const y = C.y - 12 - u * 34;
            lista.push({ pos: new THREE.Vector3(1.6 * Math.sin(u * Math.PI), y, 0), color: new THREE.Color(0x4caf50), escala: 0.5 });
        }
        const hojas = [{ y: -22, dir: 1 }, { y: -31, dir: -1 }];
        for (const hoja of hojas) {
            for (let k = 0; k < 12; k++) {
                const u = (k % 6) / 5;
                const lado = k < 6 ? 1 : -1;
                const largo = 2 + u * 13;
                const ancho = lado * 2.6 * Math.sin(Math.PI * u);
                lista.push({
                    pos: new THREE.Vector3(hoja.dir * largo, hoja.y + largo * 0.45 + ancho, 0),
                    color: new THREE.Color(0x66bb6a),
                    escala: 0.55,
                });
            }
        }
        return lista;
    }

    function formaGirasol(THREE, total, rnd) {
        const C = { x: 0, y: 12 };
        const petalos = puntosPetalos(THREE, C);
        const tallo = puntosTalloYHojas(THREE, C);
        const nDisco = Math.max(0, total - petalos.length - tallo.length);
        const disco = Array.from({ length: nDisco }, (_, k) => {
            const r = 9 * Math.sqrt((k + 0.5) / Math.max(nDisco, 1));
            const a = k * GOLDEN;
            return {
                pos: new THREE.Vector3(C.x + r * Math.cos(a), C.y + r * Math.sin(a), 0.5),
                color: new THREE.Color(r > 6.5 ? 0xb3641c : 0x7a4313),
                escala: 0.55,
            };
        });
        const todos = [...disco, ...petalos, ...tallo];
        // si hubiera más estrellas que puntos, las sobrantes se suman al disco
        return Array.from({ length: total }, (_, i) => todos[i] || disco[Math.floor(rnd() * disco.length)] || todos[0]);
    }

    function origenes(THREE, total, rnd) {
        return Array.from({ length: total }, () => new THREE.Vector3(
            (rnd() - 0.5) * 260,
            (rnd() - 0.5) * 170,
            -90 - rnd() * 220,
        ));
    }

    /* ---------- chispas de la explosión ---------- */

    function crearChispas(THREE, padre, centro) {
        const N = 520;
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        const g = c.getContext('2d');
        const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.4, 'rgba(255,255,255,0.5)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, 64, 64);

        const rnd = aleatorio(808);
        const pos = new Float32Array(N * 3);
        const col = new Float32Array(N * 3);
        const vel = Array.from({ length: N }, () => {
            const th = rnd() * Math.PI * 2;
            const ph = Math.acos(2 * rnd() - 1);
            const v = 25 + rnd() * 60;
            return new THREE.Vector3(Math.sin(ph) * Math.cos(th) * v, Math.sin(ph) * Math.sin(th) * v, Math.cos(ph) * v);
        });
        const paleta = [0xffd93b, 0xffb627, 0xff86b3, 0xffffff].map((h) => new THREE.Color(h));
        for (let i = 0; i < N; i++) {
            const k = paleta[i % paleta.length];
            col.set([k.r, k.g, k.b], i * 3);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        const mat = new THREE.PointsMaterial({
            size: 1.6,
            map: new THREE.CanvasTexture(c),
            vertexColors: true,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
        const puntos = new THREE.Points(geo, mat);
        puntos.visible = false;
        puntos.frustumCulled = false;
        padre.add(puntos);

        return {
            actualizar(seg) {
                const vida = 2.4;
                puntos.visible = seg > 0 && seg < vida;
                if (!puntos.visible) return;
                const d = (1 - Math.exp(-seg * 1.6)) / 1.6; // frenado suave
                for (let i = 0; i < N; i++) {
                    pos[i * 3] = centro.x + vel[i].x * d;
                    pos[i * 3 + 1] = centro.y + vel[i].y * d;
                    pos[i * 3 + 2] = centro.z + vel[i].z * d;
                }
                geo.attributes.position.needsUpdate = true;
                mat.opacity = 1 - seg / vida;
            },
            destruir() {
                padre.remove(puntos);
                geo.dispose();
                mat.map.dispose();
                mat.dispose();
            },
        };
    }

    /* ---------- intro ---------- */

    function crear({ THREE, padre, destinos, tintes, alMostrarTexto }) {
        const total = destinos.length;
        const rnd = aleatorio(1408);
        const desde = origenes(THREE, total, rnd);
        const corazon = formaCorazon(THREE, total, rnd);
        const girasol = formaGirasol(THREE, total, rnd);
        const retraso = Array.from({ length: total }, () => rnd());
        const empuje = destinos.map((d) => d.clone().multiplyScalar(0.6).add(
            new THREE.Vector3((rnd() - 0.5) * 30, (rnd() - 0.5) * 30, (rnd() - 0.5) * 30),
        ));
        const centroFlor = new THREE.Vector3(0, 12, 0);
        let chispas = crearChispas(THREE, padre, centroFlor);

        const posiciones = destinos.map((d) => d.clone());
        const colores = tintes.map((c) => c.clone());
        const escalas = new Array(total).fill(1);
        const tmpA = new THREE.Vector3();
        const tmpB = new THREE.Vector3();
        let inicio = null;
        let terminada = false;
        let textoVisible = false;

        function posicionLatido(i, s) {
            const k = tramo(s, T.latido);
            const pulso = 1 + 0.07 * Math.pow(Math.max(0, Math.sin(k * Math.PI * 4)), 6);
            return tmpA.copy(corazon[i].pos).sub(tmpB.set(0, 6, 0)).multiplyScalar(pulso).add(tmpB);
        }

        function calcular(i, s) {
            const p = posiciones[i];
            if (s < T.latido[0]) {
                const k = easeOut(clamp((tramo(s, T.llegada) - retraso[i] * 0.35) / 0.65));
                p.lerpVectors(desde[i], corazon[i].pos, k);
                colores[i].copy(tintes[i]).lerp(corazon[i].color, k);
                escalas[i] = 0.4 + (corazon[i].escala - 0.4) * k;
            } else if (s < T.girasol[0]) {
                p.copy(posicionLatido(i, s));
                colores[i].copy(corazon[i].color);
                escalas[i] = corazon[i].escala;
            } else if (s < T.contraer[0]) {
                const k = easeInOut(clamp((tramo(s, T.girasol) - retraso[i] * 0.25) / 0.75));
                const balanceo = Math.sin(s * 1.3) * 0.6 * tramo(s, T.pausa);
                p.lerpVectors(corazon[i].pos, girasol[i].pos, k);
                p.x += balanceo * clamp((p.y + 40) / 80);
                colores[i].copy(corazon[i].color).lerp(girasol[i].color, k);
                escalas[i] = corazon[i].escala + (girasol[i].escala - corazon[i].escala) * k;
            } else if (s < T.explosion[0]) {
                const k = easeInOut(tramo(s, T.contraer));
                p.lerpVectors(girasol[i].pos, centroFlor, k * 0.18);
                colores[i].copy(girasol[i].color);
                escalas[i] = girasol[i].escala * (1 - 0.15 * k);
            } else {
                // curva: flor -> empujón hacia afuera -> su lugar en la galaxia
                const k = easeOut(tramo(s, T.explosion));
                const a = tmpA.lerpVectors(girasol[i].pos, centroFlor, 0.18);
                const u = 1 - k;
                p.set(0, 0, 0)
                    .addScaledVector(a, u * u)
                    .addScaledVector(empuje[i].clone().multiplyScalar(2.6), 2 * u * k)
                    .addScaledVector(destinos[i], k * k);
                colores[i].copy(girasol[i].color).lerp(tintes[i], k);
                escalas[i] = girasol[i].escala * 0.85 + (1 - girasol[i].escala * 0.85) * k;
            }
        }

        return {
            posiciones,
            colores,
            escalas,
            get terminada() { return terminada; },
            empezar(ahora) { if (inicio === null) inicio = ahora; },
            reiniciar(ahora) {
                if (terminada) chispas = crearChispas(THREE, padre, centroFlor);
                terminada = false;
                inicio = ahora;
            },
            get empezada() { return inicio !== null; },
            saltar(ahora) {
                if (inicio === null || terminada) return;
                const s = (ahora - inicio) / 1000;
                if (s < T.contraer[0]) inicio = ahora - T.contraer[0] * 1000;
            },
            /* devuelve cuánto de la inclinación normal de la galaxia aplicar (0..1) */
            actualizar(ahora) {
                if (terminada) return 1;
                const s = inicio === null ? 0 : (ahora - inicio) / 1000;
                for (let i = 0; i < total; i++) calcular(i, s);
                chispas.actualizar(s - T.explosion[0]);
                const mostrar = s > 1.2 && s < T.girasol[0] + 0.4;
                if (mostrar !== textoVisible) {
                    textoVisible = mostrar;
                    alMostrarTexto?.(mostrar);
                }
                if (s >= FIN + 1.2) {
                    terminada = true;
                    chispas.destruir();
                    for (let i = 0; i < total; i++) {
                        posiciones[i].copy(destinos[i]);
                        colores[i].copy(tintes[i]);
                        escalas[i] = 1;
                    }
                }
                return easeInOut(tramo(s, T.explosion));
            },
        };
    }

    window.GalaxiaIntro = { crear };
})();
