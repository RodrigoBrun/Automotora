// ================================
// 🧭 UI — Sidebar/Nav + Tema + SPA + Disponibilidad
// ================================
function decorarSidebar(){
  const links = document.querySelectorAll('#sidebar .sidebar-nav a');
  links.forEach(a=>{
    const name = a.getAttribute('data-ico');
    if (!a.querySelector('.ico')){
      const ico = document.createElement('span');
      ico.className = 'ico';
      ico.innerHTML = ICONS[name] || '';
      a.prepend(ico);
    }
    const chev = a.querySelector('.chev');
    if (chev && !chev.innerHTML) chev.innerHTML = ICONS.chev;
  });
}

function wireSidebar(){
  const hamburguesa = document.getElementById('hamburguesa');
  const sidebar = document.getElementById('sidebar');
  const btnClose = document.getElementById('sidebarClose');

  function setSidebar(open){
    if (!sidebar) return;
    sidebar.classList.toggle('active', open);
    hamburguesa?.classList.toggle('abierto', open);
    document.body.classList.toggle('no-scroll', open);
    document.body.classList.toggle('menu-abierto', open);
    sidebar.setAttribute('aria-hidden', open ? 'false' : 'true');
    hamburguesa?.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  if (hamburguesa && sidebar) {
    hamburguesa.setAttribute('aria-expanded', 'false');
    hamburguesa.addEventListener('click', () => setSidebar(!sidebar.classList.contains('active')));
    btnClose?.addEventListener('click', () => setSidebar(false));
    sidebar.addEventListener('click', (e) => { if (e.target === sidebar) setSidebar(false); });
    sidebar.querySelectorAll('.sidebar-nav a').forEach(a => a.addEventListener('click', () => setSidebar(false)));
    window.addEventListener('resize', () => { if (!window.matchMedia('(max-width: 768px)').matches) setSidebar(false); });
  }
}

function wireTema(){
  const botonModoOscuro = document.getElementById('btn-modo-oscuro');
  const modoGuardado = localStorage.getItem('modoOscuro') === 'true';
  if (modoGuardado) document.body.classList.add('modo-oscuro');
  setThemeIcon(document.body.classList.contains('modo-oscuro'));
  if (botonModoOscuro){
    botonModoOscuro.addEventListener('click', () => {
      const activado = document.body.classList.toggle('modo-oscuro');
      localStorage.setItem('modoOscuro', activado);
      setThemeIcon(activado);
    });
  }
}

function wireNavegacionSPA(){
  const enlaces = document.querySelectorAll('a[href^="#"]:not([data-spa-ignore]):not([data-close-modal])');
  enlaces.forEach((a) => {
    a.addEventListener('click', (e) => {
      const hash = a.getAttribute('href');
      if (!hash || hash === '#') return;
      const destino = document.querySelector(hash);
      if (!destino) return;
      const esMobile = window.matchMedia('(max-width: 768px)').matches;
      e.preventDefault();
      if (esMobile && destino.classList.contains('seccion')) {
        mostrarSeccion(hash.slice(1), e);
      } else {
        destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

function mostrarSeccion(id, e){
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  const hash = id.startsWith('#') ? id : `#${id}`;
  const destino = document.querySelector(hash); if (!destino) return;
  const esMobile = window.matchMedia('(max-width: 768px)').matches;
  if (esMobile) {
    document.querySelectorAll('.seccion').forEach(sec => sec.classList.remove('activa'));
    destino.classList.add('activa');
    const sidebar = document.getElementById('sidebar');
    const hamburguesa = document.getElementById('hamburguesa');
    if (sidebar) { sidebar.classList.remove('active'); sidebar.setAttribute('aria-hidden','true'); }
    if (hamburguesa) { hamburguesa.classList.remove('abierto'); hamburguesa.setAttribute('aria-expanded','false'); }
    document.body.classList.remove('no-scroll', 'menu-abierto');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function initSecciones(){
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
}

function uiActualizarDisponibilidad(){
  const etiqueta = document.getElementById("disponibilidadEstado");
  if (!etiqueta) return;
  const ahora = new Date();
  const total = ahora.getHours()*60 + ahora.getMinutes();
  const enManana = (total >= 9*60) && (total < 12*60);
  const enTarde  = (total >= 14*60) && (total < 19*60);
  const abierto  = enManana || enTarde;
  etiqueta.textContent = abierto
    ? "Disponibilidad: Abierto ahora"
    : "Disponibilidad: Cerrado (de 09–12 y 14–19)";
  etiqueta.classList.toggle('abierto', abierto);
  etiqueta.classList.toggle('cerrado', !abierto);
}
