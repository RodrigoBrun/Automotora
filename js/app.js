// ================================
// 🚀 APP (Bootstrap / Wiring robusto)
// Estilo Rodrigo — Senior
// Decisiones clave:
// - No anulamos el hash en mobile; lo respetamos y navegamos a la sección.
// - Usamos scrollMarginTop para evitar que el header tape el ancla.
// - uiWireModal se llama de forma defensiva.
// - Bloqueamos el scroll del fondo cuando el modal está abierto con MutationObserver.
// ================================
let sistema;

document.addEventListener('DOMContentLoaded', () => {
  // AOS
  if (window.AOS && typeof AOS.init === 'function') AOS.init();
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  window.addEventListener('load', () => {
    // NOTE: ya NO limpiamos el hash en mobile. Respetamos #contacto, etc.
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  });

  // 1) Dominio
  sistema = new Sistema();

  // 2) Cargar DATA con fallback (por si VEHICULOS_BASE no está o está vacío)
  (function cargarDatos() {
    const baseOk = typeof VEHICULOS_BASE !== 'undefined' && Array.isArray(VEHICULOS_BASE) && VEHICULOS_BASE.length > 0;
    const base = baseOk ? VEHICULOS_BASE : [
      // 🧪 Demo mínima solo si no hay data. Podés borrar este bloque.
      { marca:"Toyota", modelo:"Corolla", anio:2020, km:45000, tipo:"Auto", precio:17990, imagen:"./imagenes/toyota-corolla.jpg", estado:"Disponible" },
      { marca:"Ford", modelo:"Ranger", anio:2019, km:82000, tipo:"Camioneta", precio:31900, imagen:"./imagenes/ford-ranger.jpg", estado:"Disponible" }
    ];
    for (let i = 0; i < base.length; i++){
      try { sistema.agregarVehiculo(base[i]); } catch (e) { /* noop */ }
    }
  })();

  // 3) Wiring de UI y SPA
  decorarSidebar();
  wireSidebar();
  wireTema();
  wireNavegacionSPA();
  initSecciones();

  // Llamada defensiva (si el archivo del modal no cargó no frenamos el resto)
  if (typeof uiWireModal === 'function') {
    uiWireModal();
  } else {
    console.warn('uiWireModal no disponible (ver js/ui.modal.js / orden de scripts)');
  }

  // 4) Listado: asegurar contenedor + primer render (sin filtros) y luego filtros
  const cont = document.querySelector('#galeriaAutos');
  if (!cont) {
    console.error('No existe #galeriaAutos en el DOM');
    return; // no seguimos si no hay contenedor
  }

  // Primer pintado directo para aislar problema de filtros/orden
  if (sistema.vehiculos.length) {
    uiRenderVehiculos(sistema.vehiculos);
  } else {
    cont.innerHTML = '<p>No hay vehículos para mostrar.</p>';
  }

  // Ahora sí, filtros/orden
  uiCargarFiltros();
  uiWireFiltros();
  uiActualizarListado();

  // Footer año
  const spanAnio = document.querySelector("#anio");
  if (spanAnio) spanAnio.textContent = new Date().getFullYear();

  // Disponibilidad
  uiActualizarDisponibilidad();
  setInterval(uiActualizarDisponibilidad, 60000);

  // Etiquetas “Ordenar por” (por si tu HTML quedó con textos cortos)
  const ordenSel = document.getElementById('ordenSelect');
  if (ordenSel){
    const mapa = {
      'relevancia': 'Relevancia',
      'precio-asc': 'Precio: de menor a mayor',
      'precio-desc': 'Precio: de mayor a menor',
      'anio-desc': 'Año: más nuevo primero',
      'anio-asc': 'Año: más antiguo primero',
      'km-asc': 'Kilómetros: de menor a mayor',
      'km-desc': 'Kilómetros: de mayor a menor'
    };
    for (let i=0; i<ordenSel.options.length; i++){
      const opt = ordenSel.options[i];
      if (mapa[opt.value]) opt.textContent = mapa[opt.value];
    }
  }

  // ================================
  // 🔗 Navegación con hash (#contacto, #vehiculos)
  // - En desktop: scrollIntoView con offset (via scrollMarginTop)
  // - En mobile SPA: activar sección y scrollear a top
  // ================================
  // Offset para que el header fijo no tape la sección
  document.querySelectorAll('.seccion').forEach(sec => {
    sec.style.scrollMarginTop = '72px'; // ajustá al alto real del header
  });

  function navegarPorHash() {
    const hash = location.hash;
    if (!hash) return;
    const destino = document.querySelector(hash);
    if (!destino) return;
    const esMobile = window.matchMedia('(max-width: 768px)').matches;

    if (document.body.classList.contains('spa-mobile') || esMobile) {
      if (typeof mostrarSeccion === 'function') {
        mostrarSeccion(hash.slice(1));
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    } else {
      destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Al cargar con hash presente
  if (location.hash) {
    // esperar un tick para que todo esté montado
    setTimeout(navegarPorHash, 0);
  }
  // Si el hash cambia luego (links internos)
  window.addEventListener('hashchange', navegarPorHash);

  // ================================
  // 🪟 Modal: bloquear scroll del fondo cuando está abierto
  // - Observamos cambios de clase en #modal (añade/quita .abierto)
  // - Evita que el body se mueva detrás del modal en mobile
  // ================================
  (function bloquearScrollFondoConModal(){
    const modal = document.getElementById('modal');
    if (!modal || typeof MutationObserver === 'undefined') return;
    const obs = new MutationObserver(() => {
      const abierto = modal.classList.contains('abierto');
      document.body.classList.toggle('no-scroll', abierto);
    });
    obs.observe(modal, { attributes: true, attributeFilter: ['class'] });
  })();

  // 🔎 Helpers de diagnóstico (podés usarlos en la consola)
  window.dumpEstado = function(){
    return {
      vehiculos: sistema.vehiculos.length,
      tieneGaleria: !!document.querySelector('#galeriaAutos'),
      marcas: sistema.obtenerMarcas()
    };
  };
});
