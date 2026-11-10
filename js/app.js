// Recuperamos carrito y favoritos guardados en el navegador.
let carrito = JSON.parse(localStorage.getItem("roble-carrito")) || [];
let favoritos = JSON.parse(localStorage.getItem("roble-favoritos")) || [];

// Seleccionamos elementos del HTML con querySelector.
const catalogo = document.querySelector("#catalogo-productos");
const listaFavoritos = document.querySelector("#lista-favoritos");
const itemsCarrito = document.querySelector("#items-carrito");
const contadorCarrito = document.querySelector("#contador-carrito");
const contadorFavoritos = document.querySelector("#contador-favoritos");
const cantidadArticulos = document.querySelector("#cantidad-articulos");
const totalCarrito = document.querySelector("#total-carrito");
const carritoVacio = document.querySelector("#carrito-vacio");
const favoritosVacio = document.querySelector("#favoritos-vacio");
const notificacion = document.querySelector("#notificacion");
const botonFinalizar = document.querySelector("#btn-finalizar");

const formatoPrecio = valor => new Intl.NumberFormat("es-AR", {
  style: "currency", currency: "ARS", maximumFractionDigits: 0
}).format(valor);

function guardarDatos() {
  localStorage.setItem("roble-carrito", JSON.stringify(carrito));
  localStorage.setItem("roble-favoritos", JSON.stringify(favoritos));
}

function avisar(mensaje) {
  notificacion.textContent = mensaje;
  notificacion.classList.add("mostrar");
  clearTimeout(avisar.temporizador);
  avisar.temporizador = setTimeout(() => notificacion.classList.remove("mostrar"), 2200);
}

// Template string para crear cada tarjeta de producto.
function crearCard(producto) {
  const esFavorito = favoritos.includes(producto.id);
  return `
    <article class="card">
      <div class="imagen-card">
        <img src="${producto.imagen}" alt="${producto.nombre}" loading="lazy">
        <button class="corazon ${esFavorito ? "activo" : ""}" data-accion="favorito"
          data-id="${producto.id}" aria-label="Cambiar favorito" aria-pressed="${esFavorito}">♥</button>
      </div>
      <div class="contenido-card">
        <h3>${producto.nombre}</h3>
        <p>${producto.descripcion}</p>
        <div class="pie-card">
          <strong>${formatoPrecio(producto.precio)}</strong>
          <button class="agregar" data-accion="agregar" data-id="${producto.id}">Agregar +</button>
        </div>
      </div>
    </article>`;
}

// map() genera las cards desde el array, no están escritas manualmente en el HTML.
function renderizarCatalogo() {
  catalogo.innerHTML = PRODUCTOS.map(crearCard).join("");
}

function renderizarFavoritos() {
  const elegidos = PRODUCTOS.filter(producto => favoritos.includes(producto.id));
  listaFavoritos.innerHTML = elegidos.map(crearCard).join("");
  favoritosVacio.hidden = elegidos.length > 0;
  contadorFavoritos.textContent = favoritos.length;
}

function renderizarCarrito() {
  itemsCarrito.innerHTML = carrito.map(item => {
    const producto = PRODUCTOS.find(p => p.id === item.id);
    if (!producto) return "";
    return `
      <article class="item-carrito">
        <img src="${producto.imagen}" alt="${producto.nombre}">
        <div class="info-item"><h3>${producto.nombre}</h3><small>${formatoPrecio(producto.precio)} c/u</small></div>
        <div class="cantidad">
          <button data-accion="disminuir" data-id="${producto.id}" aria-label="Disminuir">−</button>
          <span>${item.cantidad}</span>
          <button data-accion="aumentar" data-id="${producto.id}" aria-label="Aumentar">+</button>
        </div>
        <strong>${formatoPrecio(producto.precio * item.cantidad)}</strong>
        <button class="eliminar" data-accion="eliminar" data-id="${producto.id}" aria-label="Eliminar">×</button>
      </article>`;
  }).join("");

  const unidades = carrito.reduce((suma, item) => suma + item.cantidad, 0);
  const total = carrito.reduce((suma, item) => {
    const producto = PRODUCTOS.find(p => p.id === item.id);
    return suma + (producto ? producto.precio * item.cantidad : 0);
  }, 0);

  contadorCarrito.textContent = unidades;
  cantidadArticulos.textContent = unidades;
  totalCarrito.textContent = formatoPrecio(total);
  carritoVacio.hidden = carrito.length > 0;
  botonFinalizar.disabled = carrito.length === 0;
}

function actualizar() {
  renderizarCatalogo();
  renderizarFavoritos();
  renderizarCarrito();
  guardarDatos();
}

function agregarAlCarrito(id) {
  const existente = carrito.find(item => item.id === id);
  if (existente) existente.cantidad++;
  else carrito.push({ id, cantidad: 1 });
  actualizar();
  avisar("Producto agregado al carrito");
}

function cambiarCantidad(id, cambio) {
  const item = carrito.find(producto => producto.id === id);
  if (!item) return;
  item.cantidad += cambio;
  if (item.cantidad <= 0) carrito = carrito.filter(producto => producto.id !== id);
  actualizar();
}

function cambiarFavorito(id) {
  if (favoritos.includes(id)) {
    favoritos = favoritos.filter(favoritoId => favoritoId !== id);
    avisar("Eliminado de favoritos");
  } else {
    favoritos.push(id);
    avisar("Agregado a favoritos");
  }
  actualizar();
}

// Delegación de eventos: un listener por contenedor y closest() para encontrar el botón.
function manejarCards(evento) {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton) return;
  const id = Number(boton.dataset.id);
  if (boton.dataset.accion === "agregar") agregarAlCarrito(id);
  if (boton.dataset.accion === "favorito") cambiarFavorito(id);
}

catalogo.addEventListener("click", manejarCards);
listaFavoritos.addEventListener("click", manejarCards);

itemsCarrito.addEventListener("click", evento => {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton) return;
  const id = Number(boton.dataset.id);
  const accion = boton.dataset.accion;
  if (accion === "aumentar") cambiarCantidad(id, 1);
  if (accion === "disminuir") cambiarCantidad(id, -1);
  if (accion === "eliminar") {
    carrito = carrito.filter(item => item.id !== id);
    actualizar();
    avisar("Producto eliminado del carrito");
  }
});

// Botón de finalizar compra: simula la confirmación del pedido; no procesa pagos reales.
botonFinalizar.addEventListener("click", () => {
  if (carrito.length === 0) {
    avisar("El carrito está vacío");
    return;
  }
  const unidades = carrito.reduce((suma, item) => suma + item.cantidad, 0);
  const total = carrito.reduce((suma, item) => {
    const producto = PRODUCTOS.find(p => p.id === item.id);
    return suma + (producto ? producto.precio * item.cantidad : 0);
  }, 0);

  alert(
    "¡Gracias por tu compra en Carpintería Roble!\\n\\n" +
    "Cantidad de artículos: " + unidades + "\\n" +
    "Total: " + formatoPrecio(total) + "\\n\\n" +
    "Tu pedido fue registrado correctamente. Esta es una demostración; no se realizó ningún cobro."
  );
  carrito = [];
  actualizar();
  avisar("¡Pedido confirmado!");
});

// Primera renderización al abrir la página.
actualizar();
