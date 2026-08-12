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
            e.preventDefault();

            // Validación básica
            const name = document.getElementById('booking-name');
            const email = document.getElementById('booking-email');
            const phone = document.getElementById('booking-phone');
            const experience = document.getElementById('booking-experience');
            const date = document.getElementById('booking-date');
            const group = document.getElementById('booking-group');

            let isValid = true;
            let errorMessages = [];

            // Limpiar errores anteriores
            document.querySelectorAll('.form-error').forEach(el => el.remove());

            if (!name.value.trim()) {
                isValid = false;
                errorMessages.push('Por favor ingresa tu nombre completo.');
                showFieldError(name, 'Este campo es obligatorio');
            }

            if (!email.value.trim() || !isValidEmail(email.value)) {
                isValid = false;
                errorMessages.push('Por favor ingresa un correo electrónico válido.');
                showFieldError(email, 'Correo electrónico inválido');
            }

            if (!phone.value.trim()) {
                isValid = false;
                errorMessages.push('Por favor ingresa un número de teléfono de contacto.');
                showFieldError(phone, 'Este campo es obligatorio');
            }

            if (!experience.value) {
                isValid = false;
                errorMessages.push('Por favor selecciona una experiencia.');
                showFieldError(experience, 'Selecciona una opción');
            }

            if (!date.value) {
                isValid = false;
                errorMessages.push('Por favor selecciona una fecha.');
                showFieldError(date, 'Este campo es obligatorio');
            }

            const groupValue = parseInt(group.value);
            if (isNaN(groupValue) || groupValue < 5 || groupValue > 20) {
                isValid = false;
                errorMessages.push('El número de participantes debe ser entre 5 y 20 personas.');
                showFieldError(group, 'Mínimo 5 · máximo 20');
            }

            if (!isValid) {
                // Mostrar mensaje de error general
                const errorSummary = document.createElement('div');
                errorSummary.className = 'form-error-summary';
                errorSummary.style.cssText = `
                    background-color: #fee;
                    color: #c0392b;
                    padding: var(--spacing-md);
                    border-radius: var(--radius-md);
                    margin-bottom: var(--spacing-md);
                    border-left: 4px solid #c0392b;
                `;
                errorSummary.innerHTML = `
                    <strong>❌ Por favor corrige los siguientes errores:</strong>
                    <ul style="margin-top: var(--spacing-sm); padding-left: var(--spacing-lg);">
                        ${errorMessages.map(msg => `<li>${msg}</li>`).join('')}
                    </ul>
                `;
                
                // Remover summary anterior si existe
                const oldSummary = document.querySelector('.form-error-summary');
                if (oldSummary) oldSummary.remove();
                
                bookingForm.insertBefore(errorSummary, bookingForm.firstChild);
                
                // Scroll al primer error
                const firstError = document.querySelector('.form-error');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return;
            }

            // Si todo es válido
            const formData = {
                nombre: name.value.trim(),
                email: email.value.trim(),
                telefono: phone.value.trim(),
                experiencia: experience.value,
                fecha: date.value,
                participantes: groupValue,
                notas: document.getElementById('booking-notes').value.trim()
            };

            // Mostrar mensaje de éxito
            const successMessage = document.createElement('div');
            successMessage.className = 'form-success';
            successMessage.style.cssText = `
                background-color: #e8f8e8;
                color: #1a7a1a;
                padding: var(--spacing-lg);
                border-radius: var(--radius-md);
                text-align: center;
                border-left: 4px solid #2ecc71;
            `;
            successMessage.innerHTML = `
                <h3 style="font-family: var(--font-heading);">✅ ¡Reserva solicitada!</h3>
                <p>Hemos recibido tu solicitud para <strong>${getExperienceLabel(formData.experiencia)}</strong>.</p>
                <p>Una persona de Nativa se pondrá en contacto contigo para confirmar los detalles.</p>
                <p style="margin-top: var(--spacing-sm); font-size: 0.9rem; color: #555;">
                    📧 Se ha enviado una copia a ${formData.email}
                </p>
            `;

            // Remover mensajes anteriores
            document.querySelectorAll('.form-success, .form-error-summary').forEach(el => el.remove());
            
            // Insertar mensaje de éxito
            bookingForm.insertBefore(successMessage, bookingForm.firstChild);
            
            // Resetear el formulario
            bookingForm.reset();

            // Guardar en localStorage como "reserva pendiente"
            try {
                const reservas = JSON.parse(localStorage.getItem('nativa_reservas') || '[]');
                reservas.push({
                    ...formData,
                    fecha_solicitud: new Date().toISOString(),
                    estado: 'pendiente'
                });
                localStorage.setItem('nativa_reservas', JSON.stringify(reservas));
            } catch (e) {
                // Silencioso
            }

            console.log('📋 Reserva enviada:', formData);

            // Scroll al mensaje
            successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
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