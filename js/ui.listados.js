// ================================
// 🖼️ UI — Listado, filtros y orden
// Dependencias: Sistema, crearImagenSegura, debounce
// ================================
/** Lee filtros desde el DOM */
function uiLeerFiltros(){
  const marca = document.querySelector("#filtroMarca")?.value || "";
  const tipo = document.querySelector("#filtroTipo")?.value || "";
  const kmStr = document.querySelector("#filtroKm")?.value || "";
  const anioStr = document.querySelector("#filtroAnio")?.value || "";
  const q = document.querySelector("#filtroSearch")?.value || "";
  const filtros = {};
  if (marca) filtros.marca = marca;
  if (tipo) filtros.tipo = tipo;
  if (kmStr) filtros.kmMax = Number(kmStr);
  if (anioStr) filtros.anioMin = Number(anioStr);
  if (q) filtros.q = q;
  return filtros;
}

function uiAplicarOrden(lista, criterio){
  const arr = lista.slice();
  switch (criterio){
    case "precio-asc": arr.sort((a,b)=>a.precio-b.precio); break;
    case "precio-desc": arr.sort((a,b)=>b.precio-a.precio); break;
    case "anio-desc": arr.sort((a,b)=>b.anio-a.anio); break;
    case "anio-asc": arr.sort((a,b)=>a.anio-b.anio); break;
    case "km-asc": arr.sort((a,b)=>a.km-b.km); break;
    case "km-desc": arr.sort((a,b)=>b.km-a.km); break;
    default: break;
  }
  return arr;
}

function uiCargarFiltros(){
  const selMarca = document.querySelector("#filtroMarca");
  if (!selMarca) return;
  selMarca.querySelectorAll("option:not(:first-child)").forEach(opt=>opt.remove());
  sistema.obtenerMarcas().forEach(m=>{
    const opt = document.createElement("option");
    opt.value = m; opt.textContent = m; selMarca.appendChild(opt);
  });
}

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

    const img = crearImagenSegura(
      v.imagen, `${v.marca} ${v.modelo}`,
      { sizes: "(max-width:768px) 100vw, (max-width:1024px) 50vw, 33vw" }
    );
    card.appendChild(img);

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

  if (window.AOS && typeof AOS.refreshHard === 'function') AOS.refreshHard();
}

function uiWireFiltros(){
  const selects = document.querySelectorAll("#filtroMarca, #filtroTipo, #filtroKm, #filtroAnio, #ordenSelect");
  selects.forEach(sel=> sel.addEventListener("change", uiActualizarListado));
  const inputSearch = document.querySelector("#filtroSearch");
  if (inputSearch) inputSearch.addEventListener("input", debounce(uiActualizarListado, 200));
  const btnLimpiar = document.querySelector("#btnLimpiarFiltros");
  if (btnLimpiar){
    btnLimpiar.addEventListener("click", ()=>{
      document.querySelectorAll(".filtros select, .filtros input").forEach(el=>el.value="");
      uiActualizarListado();
    });
  }
}

function uiActualizarListado(){
  const filtros = uiLeerFiltros();
  const orden = document.querySelector("#ordenSelect")?.value || "relevancia";
  const lista = sistema.obtenerVehiculosFiltrados(filtros);
  const ordenada = uiAplicarOrden(lista, orden);
  uiRenderVehiculos(ordenada);
}
