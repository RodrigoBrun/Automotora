// ================================
// 🛠️ Utils (UI-agnósticas y UI-lite)
// Estilo Rodrigo — Senior
// -------------------------------
// Decisiones:
// - SVG inline completos (sin "..." ni paths truncados) para evitar errores de parseo.
// - Funciones puras y reutilizables (sin dependencias de dominio).
// - Imagen segura con fallback y normalización de rutas.
// ================================

/** Iconos inline (fallback si Phosphor no carga) */
const ICONS = {
  moon: '<svg width="18" height="18" viewBox="0 0 256 256" aria-hidden="true"><path d="M228.5 152.5a92 92 0 0 1-125-125a8 8 0 0 0-9.7-10.8A108 108 0 1 0 241.3 187.2a8 8 0 0 0-10.8-9.7Z" fill="currentColor"/></svg>',
  sun:  '<svg width="18" height="18" viewBox="0 0 256 256" aria-hidden="true"><path d="M128 84a44 44 0 1 0 44 44a44 44 0 0 0-44-44Zm0-60a8 8 0 0 1 8 8v20a8 8 0 0 1-16 0V32a8 8 0 0 1 8-8Zm0 208a8 8 0 0 1 8 8v20a8 8 0 0 1-16 0v-20a8 8 0 0 1 8-8ZM24 128a8 8 0 0 1 8-8h20a8 8 0 0 1 0 16H32a8 8 0 0 1-8-8Zm180-8h20a8 8 0 0 1 0 16h-20a8 8 0 0 1 0-16ZM45.7 45.7a8 8 0 0 1 11.3 0l14.1 14.1a8 8 0 0 1-11.3 11.3L45.7 57a8 8 0 0 1 0-11.3Zm139.2 139.2a8 8 0 0 1 11.3 0l14.1 14.1a8 8 0 1 1-11.3 11.3l-14.1-14.1a8 8 0 0 1 0-11.3Zm25.4-128a8 8 0 0 1 0 11.3l-14.1 14.1a8 8 0 1 1-11.3-11.3l14.1-14.1a8 8 0 0 1 11.3 0ZM66.9 185.8a8 8 0 0 1 0 11.3L52.8 211.2a8 8 0 0 1-11.3-11.3l14.1-14.1a8 8 0 0 1 11.3 0Z" fill="currentColor"/></svg>',
  x:    '<svg width="18" height="18" viewBox="0 0 256 256" aria-hidden="true"><path d="m205.7 194.3-60-60 60-60a8 8 0 0 0-11.4-11.3l-60 60-60-60A8 8 0 1 0 62.9 74l60 60-60 60a8 8 0 0 0 11.3 11.3l60-60 60 60a8 8 0 0 0 11.3-11.3Z" fill="currentColor"/></svg>',
  chev: '<svg width="16" height="16" viewBox="0 0 256 256" aria-hidden="true"><path d="M96 48l64 80-64 80" fill="none" stroke="currentColor" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

/**
 * Cambia el icono del botón de tema (sol/luna).
 * @param {boolean} isLight - true si está en modo claro.
 * @pre Debe existir #btn-modo-oscuro en el DOM.
 */
function setThemeIcon(isLight){
  const btn = document.getElementById('btn-modo-oscuro');
  if (!btn) return;
  btn.innerHTML = isLight ? ICONS.sun : ICONS.moon;
  btn.setAttribute('aria-label', isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro');
}

/**
 * Debounce simple.
 * @param {Function} fn
 * @param {number} [wait=250]
 * @returns {Function}
 */
function debounce(fn, wait=250){
  let t;
  return (...args)=>{
    clearTimeout(t);
    t = setTimeout(()=>fn(...args), wait);
  };
}

/**
 * Crea un <img> robusto que:
 * - Normaliza rutas relativas.
 * - Hace fallback a placeholder si falla la carga.
 * - En segundo fallo, usa un 1x1 transparente para evitar loops.
 * @param {string} src
 * @param {string} alt
 * @param {{className?:string, sizes?:string, srcset?:string}} [opts]
 * @returns {HTMLImageElement}
 * @pre `src` puede ser relativo o absoluto.
 * @post Devuelve un <img> listo para inyectar.
 */
function crearImagenSegura(src, alt, opts = {}) {
  const RUTA_PLACEHOLDER = "./imagenes/placeholder-auto.jpg";
  const TRANSPARENTE_1x1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/abxP/QAAAAASUVORK5CYII=";

  function normalizarRuta(r) {
    if (!r) return RUTA_PLACEHOLDER;
    const esAbsoluta = /^(https?:|data:|blob:|\/)/i.test(r);
    if (esAbsoluta) return r;
    if (r.startsWith("./")) return r;
    return `./${r}`;
  }

  const img = document.createElement("img");
  if (opts.className) img.className = opts.className;
  img.alt = alt || "";
  img.loading = "lazy";
  img.decoding = "async";
  if (opts.sizes) img.sizes = opts.sizes;
  if (opts.srcset) img.srcset = opts.srcset;

  let intento = 0;

  function setSrc(res) {
    const ruta = normalizarRuta(res);
    try { img.src = new URL(ruta, document.baseURI).href; }
    catch { img.src = ruta; }
  }

  setSrc(src);

  img.onerror = () => {
    intento++;
    if (intento === 1) {
      setSrc(RUTA_PLACEHOLDER);
    } else {
      img.onerror = null;
      img.src = TRANSPARENTE_1x1;
    }
  };

  return img;
}
