/**
 * NATIVA · TURISMO SOSTENIBLE
 * JavaScript - menú, formulario con control de cupos
 */
(function () {
    'use strict';

    // Anti-clickjacking (GitHub Pages no permite X-Frame-Options)
    if (window.top !== window.self) {
        try { window.top.location = window.self.location; } catch (e) { document.documentElement.style.display = 'none'; }
    }

    const URL_API = (window.NATIVA_CONFIG && window.NATIVA_CONFIG.URL_API) || '';
    const URL_OK = /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(URL_API);
    const COOLDOWN_MS = 30000;
    const TIMEOUT_MS = 15000;
    const RUTAS = ['rios', 'sabana', 'cerro'];
    const NOMBRES = { rios: 'Entre Ríos', sabana: 'Ruta Ancestral', cerro: 'Ruta Cerro' };
    const CONTACTO = 'nativaecoturismoycultura@gmail.com';

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
    const expSelect = document.getElementById('booking-experience');
    const groupInput = document.getElementById('booking-group');
    const groupHelp = document.getElementById('grupo-help');
    const cuposInfo = document.getElementById('cupos-info');
    const valorEl = document.getElementById('valor-estimado');

    // Valores por defecto; el servidor (Code.gs) los reemplaza al consultar cupos
    const CFG = { minGrupo: 7, maxGrupo: 20, maxIndividual: 6, minSalida: 7, cupos: 20, umbral: 15, tarifas: null };
    let dispActual = null; // cupos libres de la ruta/fecha elegidas (null = desconocido)
    const cacheDisp = new Map();
    let seq = 0;

    function pad(n) { return String(n).padStart(2, '0'); }
    function todayISO() {
        const t = new Date();
        return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate());
    }
    function fechaLarga(iso) {
        return new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });
    }
    function money(n) { return '$' + n.toLocaleString('es-CO'); }
    function setStatus(msg, type) {
        if (!status) return;
        status.textContent = msg;
        status.className = 'form-status' + (type ? ' is-' + type : '');
    }
    function setCupos(msg, type) {
        if (!cuposInfo) return;
        cuposInfo.textContent = msg;
        cuposInfo.className = 'cupos-info' + (type ? ' is-' + type : '');
    }

    // ----- Tipo de reserva: individual (1 a 6) o grupo (7 a 20) -----
    function tipoActual() {
        const r = document.querySelector('input[name="tipo"]:checked');
        return r ? r.value : 'individual';
    }
    function rango() {
        const grupo = tipoActual() === 'grupo';
        const min = grupo ? CFG.minGrupo : 1;
        let max = grupo ? CFG.maxGrupo : CFG.maxIndividual;
        if (dispActual !== null) max = Math.min(max, dispActual);
        return { min: min, max: max };
    }
    function pintarLimites() {
        const r = rango();
        if (groupInput) { groupInput.min = r.min; groupInput.max = Math.max(r.min, r.max); }
        if (groupHelp) {
            groupHelp.textContent = r.max < r.min
                ? 'No hay cupos suficientes para este tipo de reserva en esta fecha'
                : 'Mínimo ' + r.min + ' · máximo ' + r.max + (r.max === 1 ? ' persona' : ' personas');
        }
    }
    function clampGrupo() {
        const r = rango();
        if (!groupInput || r.max < r.min) return;
        let v = parseInt(groupInput.value, 10);
        if (isNaN(v) || v < r.min) v = r.min;
        if (v > r.max) v = r.max;
        groupInput.value = v;
    }
    function pintarValor() {
        if (!valorEl) return;
        const t = CFG.tarifas && expSelect ? CFG.tarifas[expSelect.value] : null;
        const n = groupInput ? parseInt(groupInput.value, 10) : NaN;
        if (!t || !(n > 0)) { valorEl.textContent = ''; return; }
        const grupal = n >= CFG.umbral;
        const unit = grupal ? t.grupal : t.base;
        valorEl.textContent = 'Valor estimado: ' + money(n * unit) + ' COP (' + n + ' × ' + money(unit) +
            (grupal ? ', tarifa grupal' : '') + '). Se confirma al reservar.';
    }
    function refrescarTipo() { pintarLimites(); clampGrupo(); pintarValor(); }

    if (dateInput) dateInput.min = todayISO();
    pintarLimites();
    document.querySelectorAll('input[name="tipo"]').forEach(r => r.addEventListener('change', refrescarTipo));
    if (groupInput) groupInput.addEventListener('input', pintarValor);

    // ----- Consulta de cupos al Apps Script -----
    async function getDisponibilidad(fecha, force) {
        if (!URL_OK) return null;
        const c = cacheDisp.get(fecha);
        if (!force && c && Date.now() - c.t < 30000) return c.data;
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 10000);
        try {
            const r = await fetch(URL_API + '?action=disponibilidad&fecha=' + encodeURIComponent(fecha), { signal: ctrl.signal });
            const d = await r.json();
            if (d && d.status === 'ok' && d.rutas) { cacheDisp.set(fecha, { t: Date.now(), data: d }); return d; }
        } catch (e) { /* sin conexión o sin CORS: el servidor valida igual */ }
        finally { clearTimeout(timer); }
        return null;
    }

    async function actualizarCupos(force) {
        if (!dateInput || !expSelect) return;
        const fecha = dateInput.value;
        const ruta = expSelect.value;
        const mi = ++seq;
        dispActual = null;
        pintarLimites();
        setCupos('', '');
        pintarValor();
        if (!fecha || fecha < todayISO()) return;
        if (!ruta) { setCupos('Elige una ruta para ver los cupos de ese día.', ''); return; }

        setCupos('Consultando cupos…', '');
        const d = await getDisponibilidad(fecha, force);
        if (mi !== seq) return; // llegó una consulta más nueva
        if (!d) {
            setCupos('No pudimos consultar los cupos ahora. Confirmaremos la disponibilidad al revisar tu solicitud.', '');
            return;
        }
        CFG.minGrupo = d.min_grupo; CFG.maxGrupo = d.max_grupo; CFG.maxIndividual = d.max_individual;
        CFG.minSalida = d.min_salida; CFG.cupos = d.cupos_por_salida;
        CFG.umbral = d.umbral_tarifa_grupal; CFG.tarifas = d.tarifas;

        const info = d.rutas[ruta];
        const disp = d.cerrada ? 0 : (info ? info.disponibles : 0);
        dispActual = disp;
        const nombre = NOMBRES[ruta] + ' · ' + fechaLarga(fecha);

        if (d.cerrada) {
            setCupos('No hay salidas el ' + fechaLarga(fecha) + '. Elige otra fecha.', 'full');
        } else if (disp === 0) {
            setCupos('Sin cupos: ' + nombre + ' está completa. Elige otra fecha.', 'full');
        } else {
            const v = info.vendidos;
            let est;
            if (v >= CFG.minSalida) est = 'Salida confirmada ✅';
            else if (v === 0) est = 'Aún sin reservas: la salida se confirma al completar ' + CFG.minSalida + ' personas.';
            else est = 'Salida en formación: faltan ' + (CFG.minSalida - v) + ' personas para confirmarla.';
            if (disp < CFG.minGrupo) est += ' Un grupo de ' + CFG.minGrupo + ' o más necesita otra fecha.';
            setCupos('Quedan ' + disp + ' de ' + CFG.cupos + ' cupos en ' + nombre + '. ' + est,
                disp > CFG.cupos / 2 ? 'ok' : 'low');
        }
        refrescarTipo();
    }

    if (dateInput) dateInput.addEventListener('change', () => actualizarCupos(false));
    if (expSelect) expSelect.addEventListener('change', () => actualizarCupos(false));

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
            if (card && expSelect && RUTAS.includes(card.dataset.route)) {
                expSelect.value = card.dataset.route;
                actualizarCupos(false);
            }
        });
    });

    // ===== ENVÍO =====
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
                tipo: String(f.get('tipo') || ''),
                fecha: String(f.get('fecha') || ''),
                participantes: parseInt(f.get('participantes'), 10),
                notas: String(f.get('notas') || '').trim().slice(0, 500),
                web: String(f.get('web') || '')
            };

            // Honeypot: si un bot lo llena, fingimos éxito y no enviamos nada
            if (datos.web) { form.reset(); setStatus('✅ Solicitud enviada.', 'ok'); return; }

            if (!URL_OK) {
                setStatus('❌ El formulario aún no está configurado. Escríbenos a ' + CONTACTO + '.', 'error');
                return;
            }

            const r = rango();
            const errores = [];
            if (datos.nombre.length < 2) errores.push('nombre');
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) errores.push('correo válido');
            if (!/^[0-9+\s()\-]{7,20}$/.test(datos.telefono)) errores.push('teléfono válido');
            if (!RUTAS.includes(datos.experiencia)) errores.push('ruta');
            if (!['individual', 'grupo'].includes(datos.tipo)) errores.push('tipo de reserva');
            if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha) || datos.fecha < todayISO()) errores.push('fecha futura');
            if (!(datos.participantes >= r.min && datos.participantes <= r.max)) {
                errores.push(r.max < r.min
                    ? 'una fecha con cupos disponibles para este tipo de reserva'
                    : 'participantes (' + r.min + ' a ' + r.max + ')');
            }
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

            let resp = null;
            try {
                delete datos.web;
                const res = await fetch(URL_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(datos),
                    signal: ctrl.signal
                });
                resp = await res.json();
            } catch (err) {
                resp = null; // no se pudo leer la respuesta
            } finally {
                clearTimeout(timer);
                btn.disabled = false;
                btn.textContent = textoOriginal;
            }

            cacheDisp.clear();

            if (resp && resp.status === 'ok') {
                lastSent = Date.now();
                form.reset();
                actualizarCupos(true);
                setStatus('✅ Solicitud enviada. Una persona de Nativa te contactará para confirmar tu reserva.', 'ok');
            } else if (resp && resp.status === 'full') {
                setStatus('😕 Ya no hay cupos suficientes para ese día (quedan ' + (resp.disponibles || 0) + '). Elige otra fecha.', 'error');
                actualizarCupos(true);
            } else if (resp && resp.status === 'rate') {
                setStatus('⏳ Ya recibimos una solicitud con este correo hace poco. Espera unos minutos.', 'error');
            } else if (resp) {
                setStatus('❌ No pudimos procesar la solicitud. Revisa los datos e intenta de nuevo.', 'error');
            } else {
                setStatus('⚠️ No pudimos confirmar el envío. Antes de reenviar, revisa tu correo en unos minutos o escríbenos a ' + CONTACTO + '.', 'error');
            }
        });
    }
})();
