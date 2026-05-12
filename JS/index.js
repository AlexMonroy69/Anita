// Inicializar AOS correctamente
AOS.init({ 
    duration: 1000, 
    once: true,
    offset: 120 // Empieza la animación un poco antes de llegar
});

// 1. CONTADOR REAL
const fechaInicio = new Date('February 08, 2026 00:00:00').getTime();

setInterval(() => {
    const ahora = new Date().getTime();
    const distancia = ahora - fechaInicio;
    const dias = Math.floor(distancia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((distancia % (1000 * 60)) / 1000);
    const el = document.getElementById("contador");
    if(el) el.innerHTML = `${dias}d ${horas}h ${minutos}m ${segundos}s`;
}, 1000);

// 2. NAVBAR INTELIGENTE Y GIRASOLES
const sections = document.querySelectorAll('header, section');
const navItems = document.querySelectorAll('.nav-item');
const navContainer = document.getElementById('main-nav');
let sunflowersFired = false;

window.addEventListener('scroll', () => {
    let current = "";
    const scrollPos = window.pageYOffset;
    const winHeight = window.innerHeight;
    const docHeight = document.body.offsetHeight;

    sections.forEach(section => {
        if (scrollPos >= (section.offsetTop - 300)) {
            current = section.getAttribute('id');
        }
    });

    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick').includes(current)) {
            item.classList.add('active');
        }
    });

    if ((winHeight + scrollPos) >= (docHeight - 60)) {
        navContainer.classList.add('nav-hidden');
        if (!sunflowersFired) {
            fireSunflowers();
            sunflowersFired = true;
        }
    } else {
        navContainer.classList.remove('nav-hidden');
        if (scrollPos < 500) sunflowersFired = false;
    }
});

function fireSunflowers() {
    const amount = window.innerWidth < 600 ? 25 : 50;
    for (let i = 0; i < amount; i++) {
        setTimeout(() => {
            const sf = document.createElement('div');
            sf.innerHTML = '🌻';
            sf.style.cssText = `position:fixed; left:${Math.random()*100}vw; top:-50px; z-index:9999; font-size:${Math.random()*20+20}px; pointer-events:none;`;
            document.body.appendChild(sf);
            sf.animate([
                { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
                { transform: `translateY(110vh) rotate(${Math.random()*720}deg)`, opacity: 0 }
            ], { duration: Math.random()*3000+2000 }).onfinish = () => sf.remove();
        }, i * 100);
    }
}

// 3. MODO OSCURO
document.getElementById('theme-toggle').addEventListener('click', function() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? '' : 'dark');
    this.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
});

// FUNCIONES DE INTERACCIÓN
function openEnvelope() { document.querySelector('.envelope-wrapper').classList.toggle('open'); }
function scrollToSection(id) {
    const el = document.getElementById(id);
    if(el) window.scrollTo({ top: el.offsetTop - 20, behavior: 'smooth' });
}
function soltarSorpresa() { alert("¡Eres lo más lindo de mi vida, Anita! ❤️"); }
function mensajeEspecial() { if(confirm("¿Sabes cuánto te amo?")) alert("Muchisimo mi negrita <3"); }

// Corazones constantes
setInterval(() => {
    const heart = document.createElement('div');
    heart.innerHTML = '❤️';
    heart.style.cssText = `position:fixed; left:${Math.random()*100}vw; top:-20px; z-index:999; pointer-events:none; opacity:0.6;`;
    document.body.appendChild(heart);
    heart.animate([{top:'-20px'}, {top:'105vh'}], {duration:4000}).onfinish = () => heart.remove();
}, 600);