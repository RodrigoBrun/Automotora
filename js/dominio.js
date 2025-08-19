// ================================
// 🧠 Dominio — Vehiculo + Sistema
// SRP: sin DOM, sin console.log.
// ================================
class Vehiculo {
  constructor({ id, marca, modelo, anio, km, tipo, precio, imagen, descripcion="", fotos=[], estado="Disponible" }){
    this.id = id;
    this.marca = marca; this.modelo = modelo;
    this.anio = anio;   this.km = km;
    this.tipo = tipo;   this.precio = precio;
    this.imagen = imagen;
    this.descripcion = descripcion;
    this.fotos = Array.isArray(fotos) ? fotos : [];
    this.estado = estado;
  }
}

class Sistema {
  constructor(){ /** @type {Vehiculo[]} */ this.vehiculos = []; }

  /** @returns {number} siguiente id */
  siguienteId(){
    let max = 0;
    for (let i = 0; i < this.vehiculos.length; i++){
      const id = Number(this.vehiculos[i].id) || 0;
      if (id > max) max = id;
    }
    return max + 1;
  }

  /**
   * @param {object} data
   * @returns {Vehiculo}
   * @pre marca, modelo, anio, km, tipo, precio, imagen válidos.
   */
  agregarVehiculo(data){
    const ok = data && data.marca && data.modelo &&
      Number.isFinite(Number(data.anio)) &&
      Number.isFinite(Number(data.km)) &&
      data.tipo && Number.isFinite(Number(data.precio)) &&
      data.imagen;
    if (!ok) throw new Error("Datos de vehículo incompletos o inválidos.");
    const v = new Vehiculo({
      id: Number(data.id) || this.siguienteId(),
      marca: String(data.marca).trim(),
      modelo: String(data.modelo).trim(),
      anio: Number(data.anio),
      km: Number(data.km),
      tipo: String(data.tipo).trim(),
      precio: Number(data.precio),
      imagen: String(data.imagen).trim(),
      descripcion: data.descripcion ? String(data.descripcion) : "",
      fotos: Array.isArray(data.fotos) ? data.fotos.slice() : [],
      estado: data.estado || "Disponible"
    });
    this.vehiculos.push(v);
    return v;
  }

  /** @returns {boolean} */
  eliminarVehiculo(id){
    for (let i = 0; i < this.vehiculos.length; i++){
      if (this.vehiculos[i].id === id){
        this.vehiculos.splice(i,1);
        return true;
      }
    }
    return false;
  }

  /** @returns {boolean} */
  cambiarEstado(id, nuevoEstado){ // "Disponible" | "Reservado" | "Vendido"
    for (let i = 0; i < this.vehiculos.length; i++){
      if (this.vehiculos[i].id === id){
        this.vehiculos[i].estado = nuevoEstado;
        return true;
      }
    }
    return false;
  }

  /** patch parcial; retorna true si encontró y actualizó */
  actualizarVehiculo(id, patch){
    for (let i = 0; i < this.vehiculos.length; i++){
      if (this.vehiculos[i].id === id){
        const v = this.vehiculos[i];
        // NOTE: solo campos conocidos
        if (patch.marca) v.marca = String(patch.marca).trim();
        if (patch.modelo) v.modelo = String(patch.modelo).trim();
        if (Number.isFinite(Number(patch.anio))) v.anio = Number(patch.anio);
        if (Number.isFinite(Number(patch.km))) v.km = Number(patch.km);
        if (patch.tipo) v.tipo = String(patch.tipo).trim();
        if (Number.isFinite(Number(patch.precio))) v.precio = Number(patch.precio);
        if (patch.imagen) v.imagen = String(patch.imagen).trim();
        if (typeof patch.descripcion === 'string') v.descripcion = patch.descripcion;
        if (Array.isArray(patch.fotos)) v.fotos = patch.fotos.slice();
        if (patch.estado) v.estado = patch.estado;
        return true;
      }
    }
    return false;
  }

  /** @returns {Vehiculo[]} */
  obtenerVehiculosFiltrados(filtros = {}){
    const q = (filtros.q || "").trim().toLowerCase();
    const res = [];
    for (let i = 0; i < this.vehiculos.length; i++){
      const v = this.vehiculos[i];
      if (filtros.marca && v.marca !== filtros.marca) continue;
      if (filtros.tipo && v.tipo !== filtros.tipo) continue;
      if (typeof filtros.kmMax === "number" && v.km > filtros.kmMax) continue;
      if (typeof filtros.anioMin === "number" && v.anio < filtros.anioMin) continue;
      if (q && !(`${v.marca} ${v.modelo}`.toLowerCase().includes(q))) continue;
      res.push(v);
    }
    return res;
  }

  /** @returns {string[]} marcas únicas ordenadas */
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
