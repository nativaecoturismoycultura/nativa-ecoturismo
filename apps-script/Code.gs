/**
 * NATIVA · Receptor de reservas (Google Apps Script)
 * Vinculado a una Hoja de cálculo: Extensiones > Apps Script.
 * Implementar > Nueva implementación > Aplicación web
 *   Ejecutar como: Yo   |   Quién tiene acceso: Cualquier persona
 */
const SHEET_NAME = 'Reservas';
const RUTAS = ['rios', 'sabana', 'cerro'];
const HEADERS = ['Recibido', 'Nombre', 'Correo', 'Teléfono', 'Ruta', 'Fecha', 'Participantes', 'Notas', 'Estado'];
const MAX_PER_HOUR = 60;      // tope global de envíos por hora
const EMAIL_COOLDOWN_S = 300; // 1 solicitud por correo cada 5 min

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const raw = e && e.postData && e.postData.contents;
    if (!raw || raw.length > 5000) return out('error');

    const d = JSON.parse(raw);
    if (d.web) return out('ok'); // honeypot

    const nombre = clean(d.nombre, 100);
    const email = clean(d.email, 120);
    const telefono = clean(d.telefono, 20);
    const notas = clean(d.notas, 500);
    const exp = String(d.experiencia || '');
    const fecha = String(d.fecha || '');
    const n = parseInt(d.participantes, 10);

    const hoy = Utilities.formatDate(new Date(), 'America/Bogota', 'yyyy-MM-dd');
    if (nombre.length < 2) return out('error');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return out('error');
    if (!/^[0-9+\s()\-]{7,20}$/.test(telefono)) return out('error');
    if (RUTAS.indexOf(exp) === -1) return out('error');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || fecha < hoy) return out('error');
    if (!(n >= 7 && n <= 20)) return out('error');

    // Límites de envío
    const cache = CacheService.getScriptCache();
    const hash = Utilities.base64EncodeWebSafe(
      Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, email.toLowerCase()));
    if (cache.get('e_' + hash)) return out('rate');
    const hKey = 'h_' + Math.floor(Date.now() / 3600000);
    const count = Number(cache.get(hKey) || 0);
    if (count >= MAX_PER_HOUR) return out('rate');
    cache.put('e_' + hash, '1', EMAIL_COOLDOWN_S);
    cache.put(hKey, String(count + 1), 3600);

    getSheet().appendRow([new Date(), safe(nombre), safe(email), safe(telefono),
                          exp, fecha, n, safe(notas), 'pendiente']);
    return out('ok');
  } catch (err) {
    return out('error');
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) { sh = ss.insertSheet(SHEET_NAME); sh.appendRow(HEADERS); }
  return sh;
}

function clean(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
}

// Evita inyección de fórmulas en Sheets (=, +, -, @)
function safe(v) {
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function out(s) {
  return ContentService.createTextOutput(JSON.stringify({ status: s }))
    .setMimeType(ContentService.MimeType.JSON);
}
