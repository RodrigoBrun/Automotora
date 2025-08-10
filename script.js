/* =========================================================
   SCRIPT.JS – Sistema + UI + Navegación/Sidebar/Modo Oscuro
   Estilo Rodrigo — Senior

   Decisiones clave:
   - Dominio puro (SRP). Render y eventos en funciones de UI.
   - Filtros + búsqueda + ordenar en memoria (simple, mantenible).
   - Modal “Ver más info” sin frameworks.
   - Disponibilidad de contacto (09–12, 14–19).
   - Imágenes a prueba de fallos: normalización de rutas + fallback.

   TODO:
   - Paginación cuando haya +60 vehículos.
   - Backend para form y catálogo (Firebase / Supabase / API propia).

   // NOTE: Si una imagen no carga, revisá la consola (logs [IMG]).
========================================================= */

/* ================================
   🧠 Dominio (sin interacción UI)
================================ */
/**
 * Representa un vehículo del catálogo.
 * @class
 */
class Vehiculo {
  /**
   * @param {Object} data
   * @param {number} data.id
   * @param {string} data.marca
   * @param {string} data.modelo
   * @param {number} data.anio
   * @param {number} data.km
   * @param {"Auto"|"Camioneta"|"SUV"} data.tipo
   * @param {number} data.precio
   * @param {string} data.imagen
   * @param {string} [data.descripcion]
   * @param {string[]} [data.fotos]
   * @param {"Disponible"|"Reservado"} [data.estado]
   */
  constructor({ id, marca, modelo, anio, km, tipo, precio, imagen, descripcion="", fotos=[], estado="Disponible"}) {
    this.id = id; this.marca = marca; this.modelo = modelo; this.anio = anio;
    this.km = km; this.tipo = tipo; this.precio = precio; this.imagen = imagen;
    this.descripcion = descripcion; this.fotos = fotos; this.estado = estado;
  }
}

/**
 * Orquesta datos y reglas de negocio del catálogo.
 * @class
 */
class Sistema {
  constructor(){ /** @type {Vehiculo[]} */ this.vehiculos = []; }

  /** Precarga los vehículos iniciales. */
  precargarDatos(){
    const base = [
      { id:1, marca:"Toyota", modelo:"Corolla", anio:2020, km:45000, tipo:"Auto", precio:17990, imagen:"./imagenes/toyota-corolla.jpg",
        descripcion:"Sedán confiable, bajo consumo, service al día.", fotos:["./imagenes/toyota-corolla-2.jpg"], estado:"Disponible" },
      { id:2, marca:"Volkswagen", modelo:"Golf", anio:2018, km:70000, tipo:"Auto", precio:14990, imagen:"./imagenes/vw-golf.jpg",
        descripcion:"Compacto ágil, impecable de interiores.", fotos:["./imagenes/vw-golf-2.jpg"], estado:"Disponible" },
      { id:3, marca:"BMW", modelo:"X5", anio:2021, km:35000, tipo:"SUV", precio:58900, imagen:"./imagenes/bmw-x5.jpg",
        descripcion:"Full equipo, motor potente, único dueño.", fotos:["./imagenes/bmw-x5-2.jpg"], estado:"Disponible" },

      // ✅ Ranger (las que me dijiste que sí tenés físicamente)
      { id:4, marca:"Ford", modelo:"Ranger", anio:2019, km:82000, tipo:"Camioneta", precio:31900, imagen:"./imagenes/ford-ranger.jpg",
        descripcion:"4x4 lista para trabajar, neumáticos nuevos.", fotos:["./imagenes/ford-ranger-2.jpg"], estado:"Disponible" },

      { id:5, marca:"Chevrolet", modelo:"Onix", anio:2022, km:22000, tipo:"Auto", precio:16990, imagen:"./imagenes/chevrolet-onix.jpg",
        descripcion:"Excelente relación precio-calidad, multimedia.", fotos:["./imagenes/chevrolet-onix-2.jpg"], estado:"Reservado" },
      { id:6, marca:"Land Rover", modelo:"Range Rover", anio:2020, km:41000, tipo:"SUV", precio:89900, imagen:"./imagenes/range-rover.jpg",
        descripcion:"Lujo y confort, mantenimientos oficiales.", fotos:["./imagenes/range-rover-2.jpg"], estado:"Disponible" },
    ];
    for (let i = 0; i < base.length; i++) this.vehiculos.push(new Vehiculo(base[i]));
  }

  /**
   * Devuelve vehículos filtrados por criterios.
   * @param {{marca?:string, tipo?:string, kmMax?:number, anioMin?:number, q?:string}} filtros
   * @returns {Vehiculo[]}
   * @post No modifica el estado interno.
   */
  obtenerVehiculosFiltrados(filtros){
    const q = (filtros.q || "").trim().toLowerCase();
    /** @type {Vehiculo[]} */ const resultado = [];
    for (let i = 0; i < this.vehiculos.length; i++) {
      const v = this.vehiculos[i];

      if (filtros.marca && v.marca !== filtros.marca) continue;
      if (filtros.tipo && v.tipo !== filtros.tipo) continue;
      if (typeof filtros.kmMax === "number" && v.km > filtros.kmMax) continue;
      if (typeof filtros.anioMin === "number" && v.anio < filtros.anioMin) continue;

      if (q){
        const hay = `${v.marca} ${v.modelo}`.toLowerCase().includes(q);
        if (!hay) continue;
      }
      resultado.push(v);
    }
    return resultado;
  }

  /** @returns {string[]} lista única de marcas */
  obtenerMarcas(){
    const marcas = [];
    for (let i = 0; i < this.vehiculos.length; i++){
      const m = this.vehiculos[i].marca;
      if (!marcas.includes(m)) marcas.push(m);
    }
    marcas.sort((a,b)=>a.localeCompare(b));
    return marcas;
  }
}

/* ================================
   🧩 Utilidades de UI
================================ */

/**
 * Crea una <img> robusta con:
 * - Normalización de rutas relativas (prefija "./" si hace falta)
 * - Resolución contra document.baseURI
 * - lazy loading + async decoding
 * - Fallback a placeholder y, si también falla, PNG transparente
 *
 * @param {string} src
 * @param {string} alt
 * @param {{className?:string, sizes?:string, srcset?:string}} [opts]
 * @returns {HTMLImageElement}
 * @pre Puede recibir src falsy; intentará placeholder directamente.
 */
function crearImagenSegura(src, alt, opts = {}) {
  const RUTA_PLACEHOLDER = "./imagenes/placeholder-auto.jpg";
  const TRANSPARENTE_1x1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/abxP/QAAAAASUVORK5CYII=";

  /** Normaliza rutas relativas simples ("imagenes/x.jpg" -> "./imagenes/x.jpg") */
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

  /** Setea el src resolviendo contra baseURI (sin romper data:) */
  function setSrc(res) {
    const ruta = normalizarRuta(res);
    try {
      img.src = new URL(ruta, document.baseURI).href;
    } catch {
      img.src = ruta;
    }
  }

  // Primer intento: la ruta provista (normalizada)
  setSrc(src);

  img.onerror = () => {
    intento++;
    console.warn("[IMG] Error cargando:", img.src, "alt:", alt, "intento:", intento);
    if (intento === 1) {
      // Segundo intento: placeholder local
      setSrc(RUTA_PLACEHOLDER);
    } else if (intento === 2) {
      // Último: PNG transparente para no romper layout
      img.onerror = null;
      img.src = TRANSPARENTE_1x1;
    }
  };

  return img;
}

/* ================================
   🎛️ UI (interacción y render)
================================ */
let sistema = new Sistema();

/** Debounce simple para inputs */
function debounce(fn, wait=250){
  let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), wait); };
}

/** Lee filtros desde la UI. */
function uiLeerFiltros(){
  const marca = document.querySelector("#filtroMarca")?.value || "";
  const tipo = document.querySelector("#filtroTipo")?.value || "";
  const kmStr = document.querySelector("#filtroKm")?.value || "";
  const anioStr = document.querySelector("#filtroAnio")?.value || "";
  const q = document.querySelector("#filtroSearch")?.value || "";

  /** @type {{marca?:string,tipo?:string,kmMax?:number,anioMin?:number,q?:string}} */
  const filtros = {};
  if (marca) filtros.marca = marca;
  if (tipo) filtros.tipo = tipo;
  if (kmStr) filtros.kmMax = Number(kmStr);
  if (anioStr) filtros.anioMin = Number(anioStr);
  if (q) filtros.q = q;
  return filtros;
}

/**
 * Aplica orden a una lista según criterio.
 * @param {Vehiculo[]} lista
 * @param {string} criterio
 * @returns {Vehiculo[]}
 */
function uiAplicarOrden(lista, criterio){
  const arr = lista.slice(); // no mutar
  switch (criterio){
    case "precio-asc": arr.sort((a,b)=>a.precio-b.precio); break;
    case "precio-desc": arr.sort((a,b)=>b.precio-a.precio); break;
    case "anio-desc": arr.sort((a,b)=>b.anio-a.anio); break;
    case "anio-asc": arr.sort((a,b)=>a.anio-b.anio); break;
    case "km-asc": arr.sort((a,b)=>a.km-b.km); break;
    case "km-desc": arr.sort((a,b)=>b.km-a.km); break;
    default: /* relevancia */ break;
  }
  return arr;
}

/** Rellena select de marcas. */
function uiCargarFiltros(){
  const selMarca = document.querySelector("#filtroMarca");
  if (!selMarca) return;
  selMarca.querySelectorAll("option:not(:first-child)").forEach(opt=>opt.remove());
  const marcas = sistema.obtenerMarcas();
  marcas.forEach(m=>{
    const opt = document.createElement("option");
    opt.value = m; opt.textContent = m; selMarca.appendChild(opt);
  });
}

/**
 * Renderiza la grilla de vehículos.
 * - Usa crearImagenSegura() para que nunca rompa por 404
 * @param {Vehiculo[]} lista
 */
function uiRenderVehiculos(lista){
  const cont = document.querySelector("#galeriaAutos");
  if (!cont) return;
  cont.innerHTML = "";

  if (!lista.length){
    const vacio = document.createElement("p");
    vacio.textContent = "No se encontraron vehículos con los filtros aplicados.";
    cont.appendChild(vacio);
    return;
  }

  lista.forEach(v=>{
    const card = document.createElement("article");
    card.className = "card-auto";
    card.setAttribute("data-aos","fade-up");

    // ================================
    // Imagen principal (robusta)
    // ================================
    const img = crearImagenSegura(
      v.imagen,
      `${v.marca} ${v.modelo}`,
      { sizes: "(max-width:768px) 100vw, (max-width:1024px) 50vw, 33vw" }
    );
    card.appendChild(img);

    // ================================
    // Body de la tarjeta
    // ================================
    const body = document.createElement("div");
    body.className = "card-body";

    const titulo = document.createElement("div");
    titulo.className = "card-titulo";

    const h3 = document.createElement("h3");
    h3.textContent = `${v.marca} ${v.modelo}`;

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = v.tipo;

    titulo.appendChild(h3);
    titulo.appendChild(badge);

    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.innerHTML = `<span>${v.anio}</span> · <span>${v.km.toLocaleString()} km</span> · <span>${v.estado}</span>`;

    const precio = document.createElement("div");
    precio.className = "card-precio";
    precio.textContent = `USD ${v.precio.toLocaleString()}`;

    const acciones = document.createElement("div");
    acciones.className = "card-acciones";

    const btnInfo = document.createElement("button");
    btnInfo.className = "btn-info";
    btnInfo.textContent = "Ver más info";
    btnInfo.addEventListener("click", ()=>uiAbrirModalVehiculo(v));
    acciones.appendChild(btnInfo);

    body.appendChild(titulo);
    body.appendChild(meta);
    body.appendChild(precio);
    body.appendChild(acciones);

    card.appendChild(body);
    cont.appendChild(card);
  });
}

/** Vincula eventos de filtros/búsqueda/orden. */
function uiWireFiltros(){
  const selects = document.querySelectorAll("#filtroMarca, #filtroTipo, #filtroKm, #filtroAnio, #ordenSelect");
  selects.forEach(sel=>{
    sel.addEventListener("change", uiActualizarListado);
  });

  const inputSearch = document.querySelector("#filtroSearch");
  if (inputSearch){
    inputSearch.addEventListener("input", debounce(uiActualizarListado, 200));
  }

  const btnLimpiar = document.querySelector("#btnLimpiarFiltros");
  if (btnLimpiar){
    btnLimpiar.addEventListener("click", ()=>{
      document.querySelectorAll(".filtros select, .filtros input").forEach(el=>el.value="");
      uiActualizarListado();
    });
  }
}

/** Aplica filtros + orden y renderiza. */
function uiActualizarListado(){
  const filtros = uiLeerFiltros();
  const orden = document.querySelector("#ordenSelect")?.value || "relevancia";
  const lista = sistema.obtenerVehiculosFiltrados(filtros);
  const ordenada = uiAplicarOrden(lista, orden);
  uiRenderVehiculos(ordenada);
}

/* ================================
   🪟 Modal “Ver más info”
================================ */
/**
 * Abre el modal con la info del vehículo.
 * - DOM a mano para usar crearImagenSegura también en fotos.
 * @param {Vehiculo} v
 */
function uiAbrirModalVehiculo(v){
  const modal = document.getElementById("modal");
  const body  = document.getElementById("modalBody");
  if (!modal || !body) return;

  body.innerHTML = "";

  // Header (título + badge)
  const header = document.createElement("div");
  header.className = "modal-header";

  const h3 = document.createElement("h3");
  h3.textContent = `${v.marca} ${v.modelo}`;

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = v.tipo;

  header.appendChild(h3);
  header.appendChild(badge);

  // Galería (principal + secundarias)
  const galeria = document.createElement("div");
  galeria.className = "modal-galeria";

  const contPrincipal = document.createElement("div");
  contPrincipal.appendChild(
    crearImagenSegura(v.imagen, `${v.marca} ${v.modelo}`)
  );

  const contSec = document.createElement("div");
  if (Array.isArray(v.fotos) && v.fotos.length) {
    v.fotos.forEach(src=>{
      contSec.appendChild(
        crearImagenSegura(src, `${v.marca} ${v.modelo} foto adicional`)
      );
    });
  }

  galeria.appendChild(contPrincipal);
  galeria.appendChild(contSec);

  // Datos + CTA
  const datos = document.createElement("div");
  datos.className = "modal-datos";

  const specs = document.createElement("div");
  specs.className = "modal-specs";
  specs.innerHTML = `
    <span>Año: <strong>${v.anio}</strong></span>
    <span>Kilómetros: <strong>${v.km.toLocaleString()} km</strong></span>
    <span>Estado: <strong>${v.estado}</strong></span>
  `;

  const precio = document.createElement("div");
  precio.className = "modal-precio";
  precio.textContent = `USD ${v.precio.toLocaleString()}`;

  const desc = document.createElement("p");
  desc.textContent = v.descripcion || "Sin descripción adicional.";

  const ctas = document.createElement("div");
  ctas.className = "modal-cta";                   // ⬅️ hace sticky el CTA al fondo

  // Botón que dispara la acción completa de contacto
  const btnContactar = document.createElement("button");
  btnContactar.type = "button";
  btnContactar.className = "btn-primario";
  btnContactar.textContent = "Contactar";
  btnContactar.addEventListener("click", ()=> uiContactarVehiculo(v));
  ctas.appendChild(btnContactar);

  datos.appendChild(specs);
  datos.appendChild(precio);
  datos.appendChild(desc);
  datos.appendChild(ctas);

  body.appendChild(header);
  body.appendChild(galeria);
  body.appendChild(datos);

  modal.classList.add("abierto");
  modal.setAttribute("aria-hidden","false");
}

/**
 * Cierra el modal, navega a #contacto y pre-llena el mensaje.
 * @param {Vehiculo} v
 */
function uiContactarVehiculo(v){
  // 1) Cerrar modal
  if (typeof uiCerrarModal === "function") uiCerrarModal();
  else {
    const m = document.getElementById("modal");
    if (m){ m.classList.remove("abierto"); m.setAttribute("aria-hidden","true"); }
  }

  // 2) Ir a la sección contacto (SPA mobile o scroll normal)
  const sec = document.querySelector("#contacto");
  if (sec){
    if (document.body.classList.contains("spa-mobile")){
      document.querySelectorAll(".seccion").forEach(el=>el.classList.remove("activa"));
      sec.classList.add("activa");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      sec.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } else {
    location.hash = "#contacto";
  }

  // 3) Pre-llenar mensaje
  const mensaje = document.querySelector('#contacto textarea[name="mensaje"], #contacto textarea#mensaje, #contacto textarea');
  const nombre  = document.querySelector('#contacto input[name="nombre"], #contacto input#nombre, #contacto input[type="text"]');

  const texto = `Hola, me interesa este vehículo: ${v.marca} ${v.modelo} (${v.anio}, ${v.km.toLocaleString()} km) - USD ${v.precio.toLocaleString()}.`;
  if (mensaje) mensaje.value = texto;
  if (nombre)  nombre.focus();
}


/* ---------------------------------------------------------
   CTA “Contactar” del modal → cierra, navega y pre-rellena
--------------------------------------------------------- */
function uiContactarVehiculo(v){
  // Mensaje sugerido con datos del vehículo
  const msg = `Hola, me interesa el ${v.marca} ${v.modelo} (${v.anio}, ${v.km.toLocaleString()} km). ¿Sigue disponible?`;

  // 1) Cerrar modal (si estuviera abierto)
  uiCerrarModal();

  // 2) Ir a #contacto (desktop = scroll; mobile SPA = mostrar sección)
  const esMobile = window.matchMedia('(max-width: 768px)').matches;
  if (document.body.classList.contains('spa-mobile') || esMobile) {
    // nuestra SPA muestra una sección a la vez
    if (typeof mostrarSeccion === 'function') mostrarSeccion('contacto');
  } else {
    document.querySelector('#contacto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  // Dejar el hash consistente (opcional)
  try { history.replaceState(null, '', '#contacto'); } catch {}

  // 3) Completar el formulario
  const txt = document.getElementById('mensaje');
  if (txt) {
    if (!txt.value.trim()) txt.value = msg;
    else if (!txt.value.includes(v.marca) || !txt.value.includes(v.modelo)) txt.value += `\n${msg}`;
  }

  // 4) Enfocar el campo (ligero delay para que la sección ya esté visible)
  setTimeout(() => {
    if (txt) {
      txt.focus();
      const fin = txt.value.length;
      txt.setSelectionRange(fin, fin);
    }
  }, 120);
}

function uiWireModal(){
  const modal = document.getElementById("modal");
  if (!modal) return;

  // Cerrar por backdrop o botón
  modal.addEventListener("click", (e)=>{
    const target = e.target;
    if (target && (target.hasAttribute("data-close-modal") || target.closest("[data-close-modal]"))) {
      uiCerrarModal();
    }
  });

  document.addEventListener("keydown",(e)=>{
    if (e.key === "Escape") uiCerrarModal();
  });
}

function uiCerrarModal(){
  const modal = document.getElementById("modal");
  if (!modal) return;
  modal.classList.remove("abierto");
  modal.setAttribute("aria-hidden","true");
}


/* ================================
   ⏱ Disponibilidad (09–12, 14–19)
================================ */
/**
 * Actualiza el indicador de disponibilidad en #contacto.
 * Ventanas: 09:00–12:00 y 14:00–19:00 (hora local del usuario).
 */
function uiActualizarDisponibilidad(){
  const el = document.getElementById("disponibilidadEstado");
  const punto = document.getElementById("indicadorDisponibilidad");
  if (!el || !punto) return;

  const ahora = new Date();
  const h = ahora.getHours();
  const m = ahora.getMinutes();
  const total = h*60 + m;

  const enManana = (total >= 9*60) && (total < 12*60);
  const enTarde = (total >= 14*60) && (total < 19*60);
  const abierto = enManana || enTarde;

  el.textContent = abierto ? "Disponibilidad: Abierto ahora" : "Disponibilidad: Cerrado (de 09–12 y 14–19)";
  punto.classList.toggle("estado-abierto", abierto);
  punto.classList.toggle("estado-cerrado", !abierto);
}

/* =========================================================
   MAIN – Navegación, Sidebar, Modo Oscuro y SPA Mobile
========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  // ✅ Inicia AOS
  if (window.AOS && typeof AOS.init === 'function') AOS.init();

  // 🚫 Evitar restauración de scroll
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  // ⬆️ Al cargar todo
  window.addEventListener('load', () => {
    const esMobile = window.matchMedia('(max-width: 768px)').matches;
    if (esMobile && location.hash) {
      history.replaceState(null, '', location.pathname);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  });

  // 🧭 Sidebar (mobile)
  const hamburguesa = document.getElementById('hamburguesa');
  const sidebar = document.getElementById('sidebar');
  if (hamburguesa && sidebar) {
    hamburguesa.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      const abierto = sidebar.classList.contains('active');
      sidebar.setAttribute('aria-hidden', abierto ? 'false' : 'true');
    });
  }

  // 🌙 Modo claro (toggle de .modo-oscuro)
  const botonModoOscuro = document.getElementById('btn-modo-oscuro');
  const iconoModo = botonModoOscuro ? botonModoOscuro.querySelector('i') : null;

  const modoGuardado = localStorage.getItem('modoOscuro');
  if (modoGuardado === 'true') {
    document.body.classList.add('modo-oscuro');
    if (iconoModo) { iconoModo.classList.remove('ph-moon'); iconoModo.classList.add('ph-sun'); }
  }
  if (botonModoOscuro && iconoModo) {
    botonModoOscuro.addEventListener('click', () => {
      const activado = document.body.classList.toggle('modo-oscuro');
      if (activado) { iconoModo.classList.remove('ph-moon'); iconoModo.classList.add('ph-sun'); }
      else { iconoModo.classList.remove('ph-sun'); iconoModo.classList.add('ph-moon'); }
      localStorage.setItem('modoOscuro', activado);
    });
  }

  // =========================================
// 🔗 Navegación unificada (anchors globales)
// - Mobile: SPA -> mostrarSeccion(id) si el destino es una .seccion
// - Desktop: scroll suave
// - Excluir: [data-spa-ignore], [data-close-modal]
// =========================================
function wireNavegacionSPA() {
  const enlaces = document.querySelectorAll(
    'a[href^="#"]:not([data-spa-ignore]):not([data-close-modal])'
  );

  enlaces.forEach((a) => {
    a.addEventListener('click', (e) => {
      const hash = a.getAttribute('href');
      if (!hash || hash === '#') return;

      const destino = document.querySelector(hash);
      if (!destino) return; // ancla inexistente

      const esMobile = window.matchMedia('(max-width: 768px)').matches;

      if (esMobile && destino.classList.contains('seccion')) {
        // Mobile → SPA (mostrar una sección)
        e.preventDefault();
        const id = hash.slice(1);
        if (typeof mostrarSeccion === 'function') {
          mostrarSeccion(id, e);
        }
      } else {
        // Desktop → scroll suave (o mobile a anclas que no son .seccion)
        e.preventDefault();
        if (typeof destino.scrollIntoView === 'function') {
          destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
}

  wireNavegacionSPA();

  // 🚀 Bootstrap datos/UI
  sistema.precargarDatos();
  uiCargarFiltros();
  uiWireFiltros();
  uiWireModal();
  uiActualizarListado();

  // 🗓️ Footer año
  const spanAnio = document.querySelector("#anio");
  if (spanAnio) spanAnio.textContent = new Date().getFullYear();

  // ⏱ Disponibilidad ahora + refresco cada 60s
  uiActualizarDisponibilidad();
  setInterval(uiActualizarDisponibilidad, 60000);
});

/* ===============================
   SPA mobile: mostrar sección
=============================== */
/**
 * Muestra una sección en mobile (SPA) o hace scroll en desktop.
 * @param {string} id
 * @param {Event} [e]
 */
function mostrarSeccion(id, e){
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  const hash = id.startsWith('#') ? id : `#${id}`;
  const destino = document.querySelector(hash); if (!destino) return;

  const esMobile = window.matchMedia('(max-width: 768px)').matches;
  if (esMobile) {
    document.querySelectorAll('.seccion').forEach(sec => sec.classList.remove('activa'));
    destino.classList.add('activa');

    const sidebar = document.getElementById('sidebar');
    if (sidebar) { sidebar.classList.remove('active','abierto'); sidebar.setAttribute('aria-hidden','true'); }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* ===============================
   Estado inicial – #inicio en mobile
=============================== */
(function initSecciones(){
  function aplicar(){
    const esMobile = window.matchMedia('(max-width: 768px)').matches;
    document.body.classList.toggle('spa-mobile', esMobile);
    if (esMobile){
      const actual = document.querySelector('.seccion.activa') || document.querySelector('#inicio');
      document.querySelectorAll('.seccion').forEach(sec=>sec.classList.remove('activa'));
      if (actual) actual.classList.add('activa');
    } else {
      document.querySelectorAll('.seccion').forEach(sec=>sec.classList.remove('activa'));
    }
  }
  aplicar();
  window.addEventListener('resize', aplicar);
})();



console.log("baseURI:", document.baseURI);
fetch("./imagenes/ford-ranger.jpg").then(r => console.log("status:", r.status, "url:", r.url));





