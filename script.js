/**
 * NATIVA · TURISMO SOSTENIBLE
 * JavaScript - versión endurecida (sin datos personales en consola ni localStorage)
 */
(function () {
    'use strict';

    // Anti-clickjacking (GitHub Pages no permite X-Frame-Options)
    if (window.top !== window.self) {
        try { window.top.location = window.self.location; } catch (e) { document.documentElement.style.display = 'none'; }
    }

    // ⚠️ Verifica que esta URL sea la COMPLETA de tu Apps Script (termina en /exec)
    const URL_API = 'https://script.google.com/macros/s/AKfycbw-TFGzcZXgGxegGWy1FcGyNBYguU8GWAi8Nn6NqJa1RGwV-ph_BGq1E3RpwRBOcd1-/exec';
    const COOLDOWN_MS = 30000;
    const TIMEOUT_MS = 15000;
    const RUTAS = ['rios', 'sabana', 'cerro'];

    // ===== MENÚ MÓVIL =====
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    function closeMenu() {
        navToggle.classList.remove('open');
        navMenu.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
    }

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function () {
            const isOpen = this.classList.toggle('open');
            navMenu.classList.toggle('open', isOpen);
            this.setAttribute('aria-expanded', String(isOpen));
        });
        navMenu.querySelectorAll('a').forEach(l => l.addEventListener('click', closeMenu));
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && navMenu.classList.contains('open')) {
                closeMenu();
                navToggle.focus();
            }
        });
    }

    // ===== NAVEGACIÓN ACTIVA POR SECCIÓN =====
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-menu a:not(.nav-cta)');
    if (sections.length && navItems.length && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                navItems.forEach(item => {
                    const active = item.getAttribute('href') === '#' + entry.target.id;
                    item.classList.toggle('active', active);
                    if (active) item.setAttribute('aria-current', 'page');
                    else item.removeAttribute('aria-current');
                });
            });
        }, { rootMargin: '0px 0px -40% 0px', threshold: 0.1 });
        sections.forEach(s => observer.observe(s));
    }

    // ===== FORMULARIO =====
    const form = document.getElementById('booking-form');
    const status = document.getElementById('form-status');
    const notes = document.getElementById('booking-notes');
    const dateInput = document.getElementById('booking-date');

    function pad(n) { return String(n).padStart(2, '0'); }
    function todayISO() {
        const t = new Date();
        return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate());
    }
    function setStatus(msg, type) {
        if (!status) return;
        status.textContent = msg;
        status.className = 'form-status' + (type ? ' is-' + type : '');
    }

    if (dateInput) dateInput.min = todayISO();

    // ===== BOTONES "ME INTERESA": agregan el producto a la solicitud =====
    document.querySelectorAll('.btn-market').forEach(button => {
        button.addEventListener('click', function () {
            const card = this.closest('.market-card');
            const nombre = card && card.querySelector('.market-title')
                ? card.querySelector('.market-title').textContent.trim() : 'Producto';
            if (notes) {
                const linea = 'Me interesa: ' + nombre;
                if (!notes.value.includes(linea)) {
                    const nuevo = (notes.value ? notes.value + '\n' : '') + linea;
                    if (nuevo.length <= 500) notes.value = nuevo;
                }
            }
            const original = this.textContent;
            this.textContent = '✓ Agregado a tu solicitud';
            this.classList.add('is-added');
            setTimeout(() => {
                this.textContent = original;
                this.classList.remove('is-added');
            }, 3000);
        });
    });

    // Botón "Reservar esta ruta": preselecciona la ruta en el formulario
    document.querySelectorAll('.route-card .btn-route').forEach(link => {
        link.addEventListener('click', function () {
            const card = this.closest('.route-card');
            const sel = document.getElementById('booking-experience');
            if (card && sel && RUTAS.includes(card.dataset.route)) sel.value = card.dataset.route;
        });
    });

    if (form) {
        let lastSent = 0;

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            const f = new FormData(form);
            const datos = {
                nombre: String(f.get('nombre') || '').trim().slice(0, 100),
                email: String(f.get('email') || '').trim().slice(0, 120),
                telefono: String(f.get('telefono') || '').trim().slice(0, 20),
                experiencia: String(f.get('experiencia') || ''),
                fecha: String(f.get('fecha') || ''),
                participantes: parseInt(f.get('participantes'), 10),
                notas: String(f.get('notas') || '').trim().slice(0, 500),
                web: String(f.get('web') || '')
            };

            // Honeypot: si un bot lo llena, fingimos éxito y no enviamos nada
            if (datos.web) { form.reset(); setStatus('✅ Solicitud enviada.', 'ok'); return; }

            // Validación
            const errores = [];
            if (datos.nombre.length < 2) errores.push('nombre');
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) errores.push('correo válido');
            if (!/^[0-9+\s()\-]{7,20}$/.test(datos.telefono)) errores.push('teléfono válido');
            if (!RUTAS.includes(datos.experiencia)) errores.push('ruta');
            if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha) || datos.fecha < todayISO()) errores.push('fecha futura');
            if (!(datos.participantes >= 7 && datos.participantes <= 20)) errores.push('participantes (7 a 20)');
            if (!f.get('consentimiento')) errores.push('autorización de datos');

            if (errores.length) {
                setStatus('⚠️ Revisa: ' + errores.join(', ') + '.', 'error');
                return;
            }

            if (Date.now() - lastSent < COOLDOWN_MS) {
                setStatus('⏳ Espera unos segundos antes de enviar otra solicitud.', 'error');
                return;
            }

            const btn = form.querySelector('.btn-submit');
            const textoOriginal = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Enviando...';
            setStatus('', '');

            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

            try {
                delete datos.web;
                await fetch(URL_API, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(datos),
                    signal: ctrl.signal
                });
                lastSent = Date.now();
                form.reset();
                setStatus('✅ Solicitud enviada. Una persona de Nativa te contactará pronto.', 'ok');
            } catch (err) {
                setStatus('❌ No pudimos enviar tu solicitud. Revisa tu conexión e intenta de nuevo.', 'error');
            } finally {
                clearTimeout(timer);
                btn.disabled = false;
                btn.textContent = textoOriginal;
            }
        });
    }
})();
