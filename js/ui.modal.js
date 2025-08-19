// ================================
// 🪟 UI — Modal de vehículo
// Dependencias: ICONS, crearImagenSegura
// ================================

/**
 * Abre el modal con la ficha del vehículo.
 * @param {Vehiculo} v
 * @pre Deben existir #modal y #modalBody en el DOM.
 */
function uiAbrirModalVehiculo(v){
  const modal = document.getElementById("modal");
  const body  = document.getElementById("modalBody");
  if (!modal || !body) return;

  body.innerHTML = "";

  // Header
  const header = document.createElement("div");
  header.className = "modal-header";

  const h3 = document.createElement("h3");
  h3.textContent = `${v.marca} ${v.modelo}`;

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = v.tipo;

  header.appendChild(h3);
  header.appendChild(badge);

  // Galería
  const galeria = document.createElement("div");
  galeria.className = "modal-galeria";

  const contPrincipal = document.createElement("div");
  contPrincipal.appendChild(crearImagenSegura(v.imagen, `${v.marca} ${v.modelo}`));

  const contSec = document.createElement("div");
  if (Array.isArray(v.fotos) && v.fotos.length) {
    v.fotos.forEach(src=>{
      contSec.appendChild(crearImagenSegura(src, `${v.marca} ${v.modelo} foto adicional`));
    });
  }

  galeria.appendChild(contPrincipal);
  galeria.appendChild(contSec);

  // Datos
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
  ctas.className = "modal-cta";

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

  // Montaje
  body.appendChild(header);
  body.appendChild(galeria);
  body.appendChild(datos);

  modal.classList.add("abierto");
  modal.setAttribute("aria-hidden","false");

  // Fallback ícono cerrar
  const closeBtn = modal.querySelector('.modal-close');
  if (closeBtn && !closeBtn.querySelector('svg')) closeBtn.innerHTML = ICONS.x;
}

/** Wiring de cerrar modal por click/escape. Llamar 1 vez en app.js */
function uiWireModal(){
  const modal = document.getElementById("modal");
  if (!modal) return;

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

/** Cierra el modal si existe. */
function uiCerrarModal(){
  const modal = document.getElementById("modal");
  if (!modal) return;
  modal.classList.remove("abierto");
  modal.setAttribute("aria-hidden","true");
}

/** CTA del modal: rellena mensaje y navega a contacto. */
function uiContactarVehiculo(v){
  const msg = `Hola, me interesa el ${v.marca} ${v.modelo} (${v.anio}, ${v.km.toLocaleString()} km). ¿Sigue disponible?`;
  uiCerrarModal();
  const esMobile = window.matchMedia('(max-width: 768px)').matches;
  if (document.body.classList.contains('spa-mobile') || esMobile) {
    if (typeof mostrarSeccion === 'function') mostrarSeccion('contacto');
  } else {
    document.querySelector('#contacto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  try { history.replaceState(null, '', '#contacto'); } catch {}
  const txt = document.getElementById('mensaje');
  if (txt) {
    if (!txt.value.trim()) txt.value = msg;
    else if (!txt.value.includes(v.marca) || !txt.value.includes(v.modelo)) txt.value += `\n${msg}`;
    setTimeout(() => { txt.focus(); const fin = txt.value.length; txt.setSelectionRange(fin, fin); }, 120);
  }
}
