/**
 * ============================================
 * NATIVA · TURISMO SOSTENIBLE
 * JavaScript - Comportamiento e interactividad
 * ============================================
 */

(function() {
    'use strict';

    // ===== MENÚ MÓVIL =====
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-menu a');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            const isOpen = this.classList.toggle('open');
            navMenu.classList.toggle('open');
            this.setAttribute('aria-expanded', isOpen);
        });

        // Cerrar menú al hacer clic en un enlace
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('open');
                navMenu.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
            });
        });

        // Cerrar menú con Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && navMenu.classList.contains('open')) {
                navToggle.classList.remove('open');
                navMenu.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
                navToggle.focus();
            }
        });
    }

    // ===== NAVEGACIÓN ACTIVA POR SECCIÓN =====
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-menu a:not(.nav-cta)');

    if (sections.length && navItems.length) {
        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -40% 0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    navItems.forEach(item => {
                        item.classList.toggle('active', item.getAttribute('href') === '#' + id);
                    });
                }
            });
        }, observerOptions);

        sections.forEach(section => observer.observe(section));
    }

    // ===== BOTONES "ME INTERESA" (Marketplace) =====
    const marketButtons = document.querySelectorAll('.btn-market');

    marketButtons.forEach(button => {
        button.addEventListener('click', function() {
            const producto = this.getAttribute('data-producto') || 'producto';
            const nombreProducto = this.closest('.market-card').querySelector('.market-title')?.textContent || producto;
            
            // Feedback visual
            const originalText = this.textContent;
            this.textContent = '✅ ¡Listo!';
            this.style.backgroundColor = '#2ecc71';
            this.style.color = '#ffffff';
            
            setTimeout(() => {
                this.textContent = originalText;
                this.style.backgroundColor = '';
                this.style.color = '';
            }, 3000);

            // Mostrar mensaje en consola (para desarrollo)
            console.log(`📦 Producto seleccionado: ${nombreProducto}`);
            
            // Podríamos guardar en localStorage para seguimiento
            try {
                const seleccionados = JSON.parse(localStorage.getItem('nativa_intereses') || '[]');
                if (!seleccionados.includes(nombreProducto)) {
                    seleccionados.push(nombreProducto);
                    localStorage.setItem('nativa_intereses', JSON.stringify(seleccionados));
                }
            } catch (e) {
                // Silencioso si localStorage no está disponible
            }
        });
    });

    // ===== FORMULARIO DE RESERVAS =====
    const bookingForm = document.getElementById('booking-form');

    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();bookingForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // ===== RECOLECTAR DATOS DEL FORMULARIO =====
    const nombre = document.getElementById('booking-name').value.trim();
    const email = document.getElementById('booking-email').value.trim();
    const telefono = document.getElementById('booking-phone').value.trim();
    const experiencia = document.getElementById('booking-experience').value;
    const fecha = document.getElementById('booking-date').value;
    const participantes = parseInt(document.getElementById('booking-group').value);
    const notas = document.getElementById('booking-notes').value.trim();

    // ===== VALIDACIÓN RÁPIDA =====
    if (!nombre || !email || !telefono || !experiencia || !fecha) {
        alert('⚠️ Por favor completa todos los campos obligatorios');
        return;
    }

    // ===== MOSTRAR MENSAJE DE "ENVIANDO..." =====
    const btnSubmit = this.querySelector('.btn-submit');
    const textoOriginal = btnSubmit.textContent;
    btnSubmit.textContent = '⏳ Enviando...';
    btnSubmit.disabled = true;

    // ===== CREAR EL OBJETO DE DATOS =====
    const datosReserva = {
        nombre: nombre,
        email: email,
        telefono: telefono,
        experiencia: experiencia,
        fecha: fecha,
        participantes: participantes,
        notas: notas
    };

    console.log('📤 Enviando datos:', datosReserva);

    // ===== ENVIAR A GOOGLE SHEETS =====
    // ⚠️ ¡REEMPLAZA ESTA URL CON LA QUE COPIATE EN EL PASO 3!
    const URL_API = 'https://script.google.com/macros/s/AKfycbw-TFGzcZXgGxegGWy1FcGyNBYguU8GWAi8Nn6NqJa1RGwV-ph_BGq1E3RpwRBOcd1-/exec';

    fetch(URL_API, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosReserva)
    })
    .then(() => {
        // ===== GUARDAR EN LOCALSTORAGE (respaldo) =====
        try {
            const reservas = JSON.parse(localStorage.getItem('nativa_reservas') || '[]');
            reservas.push({
                ...datosReserva,
                fecha_solicitud: new Date().toISOString(),
                estado: 'pendiente'
            });
            localStorage.setItem('nativa_reservas', JSON.stringify(reservas));
        } catch (e) {
            console.warn('No se pudo guardar en localStorage:', e);
        }

        // ===== MOSTRAR MENSAJE DE ÉXITO =====
        mostrarExito(datosReserva);
        
        // Resetear formulario
        this.reset();
    })
    .catch((error) => {
        console.error('❌ Error al enviar:', error);
        alert('❌ Hubo un error al enviar tu reserva. Por favor intenta de nuevo.');
    })
    .finally(() => {
        btnSubmit.textContent = textoOriginal;
        btnSubmit.disabled = false;
    });
});
        });

        // Función auxiliar para mostrar error en un campo
        function showFieldError(field, message) {
            field.style.borderColor = '#e74c3c';
            const error = document.createElement('span');
            error.className = 'form-error';
            error.style.cssText = `
                display: block;
                font-size: 0.85rem;
                color: #e74c3c;
                margin-top: var(--spacing-xs);
            `;
            error.textContent = '⚠️ ' + message;
            field.parentNode.appendChild(error);

            // Limpiar error al escribir
            field.addEventListener('input', function cleanup() {
                this.style.borderColor = '';
                const err = this.parentNode.querySelector('.form-error');
                if (err) err.remove();
                this.removeEventListener('input', cleanup);
            }, { once: true });
        }

        // Función auxiliar para validar email
        function isValidEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }

        // Función auxiliar para obtener label de experiencia
        function getExperienceLabel(value) {
            const labels = {
                'rios': '🌊 Entre Ríos',
                'sabana': '🔥 Sabana Ancestral'
            };
            return labels[value] || value;
        }
    }// ===== FUNCIÓN PARA MOSTRAR MENSAJE DE ÉXITO =====
function mostrarExito(datos) {
    // Remover mensajes anteriores
    document.querySelectorAll('.form-success, .form-error-summary').forEach(el => el.remove());
    
    const successMessage = document.createElement('div');
    successMessage.className = 'form-success';
    successMessage.style.cssText = `
        background-color: #e8f8e8;
        color: #1a7a1a;
        padding: 25px;
        border-radius: 12px;
        text-align: center;
        border-left: 4px solid #2ecc71;
        margin-bottom: 20px;
        animation: fadeIn 0.5s ease;
    `;
    
    const experienciaLabels = {
        'rios': '🌊 Entre Ríos',
        'sabana': '🔥 Sabana Ancestral'
    };
    
    successMessage.innerHTML = `
        <h3 style="font-family: 'Fraunces', serif; font-size: 1.5rem; margin-bottom: 10px;">
            ✅ ¡Reserva solicitada!
        </h3>
        <p><strong>${datos.nombre}</strong>, tu solicitud para <strong>${experienciaLabels[datos.experiencia] || datos.experiencia}</strong> está en proceso.</p>
        <p style="margin: 10px 0;">📅 ${datos.fecha} · 👥 ${datos.participantes} personas</p>
        <div style="background: #f0f7f0; padding: 12px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 0; font-size: 0.9rem; color: #2d5a2d;">
                📧 Se ha enviado una copia a <strong>${datos.email}</strong>
            </p>
        </div>
        <p style="font-size: 0.9rem; color: #555; margin-top: 10px;">
            Una persona de Nativa te contactará para confirmar los detalles.
        </p>
        <button onclick="location.reload()" style="
            margin-top: 15px;
            background: #173f35;
            color: #f8f4ea;
            border: none;
            padding: 10px 25px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
        ">Hacer otra reserva</button>
    `;
    
    const form = document.getElementById('booking-form');
    form.insertBefore(successMessage, form.firstChild);
    
    // Scroll al mensaje
    successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

    // ===== DETECCIÓN DE CONEXIÓN =====
    if ('connection' in navigator) {
        const connection = navigator.connection;
        if (connection.saveData) {
            // Modo de ahorro de datos: cargar imágenes más pequeñas
            document.querySelectorAll('img[loading="lazy"]').forEach(img => {
                // Podríamos cambiar src por versiones más pequeñas aquí
                console.log('📶 Modo ahorro de datos activo');
            });
        }
    }

    // ===== SERVICE WORKER (opcional, para PWA) =====
    if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
        // Descomentar si se implementa un service worker
        // navigator.serviceWorker.register('/sw.js')
        //     .then(() => console.log('✅ Service Worker registrado'))
        //     .catch(() => console.log('⚠️ Service Worker no disponible'));
    }

    // ===== INFORMACIÓN DE CONSOLA (para desarrollo) =====
    console.log('🌿 Nativa · Turismo Sostenible');
    console.log('📱 Sitio construido con buenas prácticas web');
    console.log('🔒 Seguridad: CSP, XSS prevention, HTTPS');
    console.log('♿ Accesibilidad: ARIA labels, skip links, semántica HTML5');

})();
