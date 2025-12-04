// ============================================================================
// SERVIDOR BACKEND - FERRETERÍA COMPLETA CON SISTEMA DE VENTAS
// ============================================================================
// Tecnología: Node.js + Express
// Puerto: 3000
// BD: db.json (archivo JSON local)
// ============================================================================

const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

const DB_PATH = path.join(__dirname, 'db.json');

// ============================================================================

// MIDDLEWARES
// ============================================================================

app.use(express.static(path.join(__dirname, 'public')));
// Servir imágenes y recursos sueltos desde la carpeta /img
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configurar sesiones
app.use(session({
  secret: 'clave-secreta-ferreteria-2024', // ⚠️ CAMBIAR EN PRODUCCIÓN
  resave: true,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 3600000, sameSite: 'lax' }
}));

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Lee la base de datos desde db.json
 */
function leerBaseDatos() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return crearBaseDatosVacia();
    }
    const datos = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(datos);
  } catch (error) {
    console.error('Error leyendo BD:', error);
    return crearBaseDatosVacia();
  }
}

/**
 * Crea una estructura vacía de base de datos
 */
function crearBaseDatosVacia() {
  return {
    admin: { usuario: 'admin', password: 'admin123' },
    productos: [],
    ventas: [],
    dias: [],
    clientes: [],
    reparaciones: [],
    tecnicos: [],
    historial_reparaciones: [],
    categorias: [],
    proveedores: [],
    ordenes_compra: [],
    detalles_orden: [],
    pedidos: [],
    config: {
      siteName: 'Ferretería Local',
      version: '1.0.0',
      currency: 'COP'
    },
    // Configuración por defecto del módulo POS / control de horarios
    configuracionPOS: {
      controlHorarios: false,
      horaMinInicio: '08:00',
      horaMaxInicio: '08:30',
      horaMinCierre: '17:00'
    }
  };
}

/**
 * Guarda la base de datos en db.json
 */
function guardarBaseDatos(datos) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(datos, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error guardando BD:', error);
    return false;
  }
}

/**
 * Genera un ID único
 */
function generarID() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Middleware de autenticación
 */
function verificarAutenticacion(req, res, next) {
  if (req.session.usuarioAutenticado) {
    next();
  } else {
    res.status(401).json({ error: 'No autenticado. Por favor, inicia sesión.' });
  }
}

// ============================================================================
// ENDPOINTS DE AUTENTICACIÓN
// ============================================================================

app.post('/api/login', (req, res) => {
  const { usuario, password } = req.body;
  const bd = leerBaseDatos();

  if (usuario === bd.admin.usuario && password === bd.admin.password) {
    req.session.usuarioAutenticado = true;
    req.session.usuario = usuario;
    res.json({ mensaje: 'Autenticación exitosa', usuario });
  } else {
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

app.get('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Error al cerrar sesión' });
    } else {
      res.json({ mensaje: 'Sesión cerrada' });
    }
  });
});

// ============================================================================
// ENDPOINTS DE CONFIGURACIÓN
// ============================================================================

/**
 * POST /api/config - Guarda la configuración (solo admin)
 */
app.post('/api/config', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  
  // Actualizar la configuración
  bd.configuracionPOS = {
    ...bd.configuracionPOS,
    ...req.body
  };

  if (guardarBaseDatos(bd)) {
    res.json({ mensaje: 'Configuración guardada', config: bd.configuracionPOS });
  } else {
    res.status(500).json({ error: 'Error guardando configuración' });
  }
});

/**
 * GET /api/config - Obtiene la configuración (solo admin)
 */
app.get('/api/config', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  const config = bd.config || {
    siteName: 'Ferretería Local',
    version: '1.0.0',
    currency: 'COP'
  };
  res.json(config);
});

app.get('/api/verificar-sesion', (req, res) => {
  if (req.session.usuarioAutenticado) {
    res.json({ autenticado: true, usuario: req.session.usuario });
  } else {
    res.json({ autenticado: false });
  }
});

// ============================================================================
// ENDPOINTS DE PRODUCTOS (CRUD)
// ============================================================================

/**
 * GET /api/productos - Obtiene todos los productos
 */
app.get('/api/productos', (req, res) => {
  const bd = leerBaseDatos();
  res.json(bd.productos);

/**
 * GET /api/proveedores/:id - Obtener proveedor por id (solo admin)
 */
app.get('/api/proveedores/:id', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  const p = (bd.proveedores || []).find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Proveedor no encontrado' });
  res.json(p);
});

/**
 * PUT /api/proveedores/:id - Actualizar proveedor (solo admin)
 */
app.put('/api/proveedores/:id', verificarAutenticacion, (req, res) => {
  const { nombre, contacto, telefono, email, direccion } = req.body || {};
  const bd = leerBaseDatos();
  const idx = (bd.proveedores || []).findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Proveedor no encontrado' });
  if (nombre !== undefined) bd.proveedores[idx].nombre = nombre;
  if (contacto !== undefined) bd.proveedores[idx].contacto = contacto;
  if (telefono !== undefined) bd.proveedores[idx].telefono = telefono;
  if (email !== undefined) bd.proveedores[idx].email = email;
  if (direccion !== undefined) bd.proveedores[idx].direccion = direccion;
  if (guardarBaseDatos(bd)) {
    res.json(bd.proveedores[idx]);
  } else {
    res.status(500).json({ error: 'Error actualizando proveedor' });
  }
});

/**
 * DELETE /api/proveedores/:id - Eliminar proveedor (solo admin)
 */
app.delete('/api/proveedores/:id', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  const idx = (bd.proveedores || []).findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Proveedor no encontrado' });
  const eliminado = bd.proveedores.splice(idx, 1)[0];
  if (guardarBaseDatos(bd)) {
    res.json({ mensaje: 'Proveedor eliminado', proveedor: eliminado });
  } else {
    res.status(500).json({ error: 'Error eliminando proveedor' });
  }
});
});

/**
 * GET /api/stock-bajo - Obtiene productos con stock por debajo del umbral
 * Query: ?umbral=5 (por defecto 5)
 */
app.get('/api/stock-bajo', (req, res) => {
  const umbral = parseInt(req.query.umbral || '5');
  const bd = leerBaseDatos();
  const productos = (bd.productos || []).filter(p => parseInt(p.stock || 0) < umbral);
  res.json({ umbral, count: productos.length, productos });
});

/**
 * GET /api/productos/:id - Obtiene un producto por ID
 */
app.get('/api/productos/:id', (req, res) => {
  const bd = leerBaseDatos();
  const producto = bd.productos.find(p => p.id === req.params.id);

  if (producto) {
    res.json(producto);
  } else {
    res.status(404).json({ error: 'Producto no encontrado' });
  }
});

/**
 * POST /api/productos - Crea un nuevo producto
 */
app.post('/api/productos', verificarAutenticacion, (req, res) => {
  const { nombre, descripcion, categoria, stock, precio, imagen } = req.body;

  if (!nombre || !categoria || stock === undefined || !precio) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const bd = leerBaseDatos();
  const nuevoProducto = {
    id: generarID(),
    nombre,
    descripcion: descripcion || '',
    categoria,
    stock: parseInt(stock),
    precio: parseFloat(precio),
    imagen: imagen || '',
    fechaCreacion: new Date().toISOString()
  };

  bd.productos.push(nuevoProducto);

  if (guardarBaseDatos(bd)) {
    res.status(201).json(nuevoProducto);
  } else {
    res.status(500).json({ error: 'Error al guardar el producto' });
  }
});

/**
 * PUT /api/productos/:id - Actualiza un producto
 */
app.put('/api/productos/:id', verificarAutenticacion, (req, res) => {
  const { nombre, descripcion, categoria, stock, precio, imagen } = req.body;
  const bd = leerBaseDatos();
  const indice = bd.productos.findIndex(p => p.id === req.params.id);

  if (indice === -1) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  if (nombre !== undefined) bd.productos[indice].nombre = nombre;
  if (descripcion !== undefined) bd.productos[indice].descripcion = descripcion;
  if (categoria !== undefined) bd.productos[indice].categoria = categoria;
  if (stock !== undefined) bd.productos[indice].stock = parseInt(stock);
  if (precio !== undefined) bd.productos[indice].precio = parseFloat(precio);
  if (imagen !== undefined) bd.productos[indice].imagen = imagen;

  if (guardarBaseDatos(bd)) {
    res.json(bd.productos[indice]);
  } else {
    res.status(500).json({ error: 'Error al actualizar el producto' });
  }
});

/**
 * DELETE /api/productos/:id - Elimina un producto
 */
app.delete('/api/productos/:id', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  const indice = bd.productos.findIndex(p => p.id === req.params.id);

  if (indice === -1) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  const productoEliminado = bd.productos.splice(indice, 1)[0];

  if (guardarBaseDatos(bd)) {
    res.json({ mensaje: 'Producto eliminado', producto: productoEliminado });
  } else {
    res.status(500).json({ error: 'Error al eliminar el producto' });
  }
});

// ============================================================================
// ENDPOINTS DE VENTAS
// ============================================================================

/**
 * POST /api/ventas - Registra una venta (acceso público)
 * Body: { items: [{ id, cantidad }, ...], cliente: { nombre, email, telefono } }
 */
app.post('/api/ventas', (req, res) => {
  const { items, cliente } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items no válidos' });
  }

  const bd = leerBaseDatos();

  // VALIDACIÓN: Debe haber un día abierto
  const diaAbierto = (bd.dias || []).find(d => d.estado === 'abierto');
  if (!diaAbierto) {
    return res.status(400).json({ 
      error: 'Debes iniciar el día de trabajo para registrar ventas.',
      codigo: 'DIA_NO_INICIADO'
    });
  }

  let total = 0;
  const detalles = [];

  try {
    // Verificar disponibilidad y calcular total
    for (const item of items) {
      const producto = bd.productos.find(p => p.id === item.id);

      if (!producto) {
        return res.status(404).json({ error: `Producto ${item.id} no encontrado` });
      }

      if (producto.stock < item.cantidad) {
        return res.status(400).json({
          error: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`
        });
      }

      const subtotal = producto.precio * item.cantidad;
      total += subtotal;

      detalles.push({
        idProducto: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: item.cantidad,
        subtotal
      });
    }

    // Descontar stock
    for (const item of items) {
      const producto = bd.productos.find(p => p.id === item.id);
      producto.stock -= item.cantidad;
    }

    // Registrar venta
    const venta = {
      id: generarID(),
      fecha: new Date().toISOString(),
      cliente: cliente || { nombre: 'Cliente Anónimo', email: '', telefono: '' },
      items: detalles,
      total: parseFloat(total.toFixed(2)),
      estado: 'completada'
    };

    // Añadimos la venta al listado general
    bd.ventas.push(venta);

    // Asociar la venta al día de trabajo abierto (si existe)
    // La estructura de `bd.dias` contiene objetos: { id, fecha, inicio, cierre, estado, ventas: [], total }
    bd.dias = bd.dias || [];
    const diaAbierto = bd.dias.find(d => d.estado === 'abierto');
    if (diaAbierto) {
      // Guardamos solo el id de la venta en el día para evitar duplicar objetos
      diaAbierto.ventas = diaAbierto.ventas || [];
      diaAbierto.ventas.push(venta.id);
      // Actualizamos el total provisional del día
      diaAbierto.total = parseFloat(((diaAbierto.total || 0) + venta.total).toFixed(2));
    }

    if (guardarBaseDatos(bd)) {
      res.status(201).json({ venta: venta });
    } else {
      res.status(500).json({ error: 'Error al registrar la venta' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error procesando la venta: ' + error.message });
  }
});

/**
 * GET /api/configuracion/horarios - Obtiene configuración de horarios POS (sin autenticación)
 * Usado por punto de venta para mostrar estado y validaciones de horario
 */
app.get('/api/configuracion/horarios', (req, res) => {
  const bd = leerBaseDatos();
  const config = bd.configuracionPOS || {};
  res.json({
    controlHorarios: config.controlHorarios || false,
    horaMinInicio: config.horaMinInicio || '08:00',
    horaMaxInicio: config.horaMaxInicio || '08:30',
    horaMinCierre: config.horaMinCierre || '17:00'
  });
});

/**
 * GET /api/dias/estado - Obtiene el estado actual del día (abierto/cerrado) (sin autenticación)
 * Usado por punto de venta para validar si se puede hacer ventas
 */
app.get('/api/dias/estado', (req, res) => {
  const bd = leerBaseDatos();
  bd.dias = bd.dias || [];
  const diaAbierto = bd.dias.find(d => d.estado === 'abierto');
  
  res.json({
    diaAbierto: !!diaAbierto,
    dia: diaAbierto || null
  });
});

/**
 * GET /api/ventas - Obtiene todas las ventas (solo admin)
 */
app.get('/api/ventas', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  res.json(bd.ventas);
});

/**
 * GET /api/ventas/:id - Obtiene detalles de una venta (solo admin)
 */
app.get('/api/ventas/:id', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  const venta = bd.ventas.find(v => v.id === req.params.id);

  if (venta) {
    res.json(venta);
  } else {
    res.status(404).json({ error: 'Venta no encontrada' });
  }
});

/**
 * GET /api/estadisticas-ventas - Obtiene estadísticas de ventas (solo admin)
 */
app.get('/api/estadisticas-ventas', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  const ventas = bd.ventas;

  if (ventas.length === 0) {
    return res.json({
      totalVentas: 0,
      montoTotal: 0,
      ventaPromedio: 0,
      ventaMayor: 0,
      productosVendidos: 0
    });
  }

  const totalVentas = ventas.length;
  const montoTotal = ventas.reduce((sum, v) => sum + v.total, 0);
  const ventaPromedio = montoTotal / totalVentas;
  const ventaMayor = Math.max(...ventas.map(v => v.total));
  const productosVendidos = ventas.reduce((sum, v) => 
    sum + v.items.reduce((itemSum, item) => itemSum + item.cantidad, 0), 0
  );

  res.json({
    totalVentas,
    montoTotal: parseFloat(montoTotal.toFixed(2)),
    ventaPromedio: parseFloat(ventaPromedio.toFixed(2)),
    ventaMayor,
    productosVendidos
  });
});

// ============================================================================
// RUTAS PARA SERVIR HTML
// ============================================================================

// ============================================================================
// GESTIÓN DE DÍAS DE TRABAJO (Módulo agregado)
// ============================================================================

/**
 * POST /api/dias/iniciar - Inicia un nuevo día de trabajo (solo admin)
 * Validaciones: horario permitido, no hay otro día abierto
 */
app.post('/api/dias/iniciar', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  bd.dias = bd.dias || [];

  // Evitar abrir más de un día a la vez
  const existente = bd.dias.find(d => d.estado === 'abierto');
  if (existente) {
    return res.status(400).json({ 
      error: 'Ya hay un día abierto. Cierra el día actual antes de iniciar uno nuevo.',
      codigo: 'DIA_YA_ABIERTO'
    });
  }

  // Validar horarios si está configurado
  const config = bd.configuracionPOS || {};
  if (config.controlHorarios) {
    const ahora = new Date();
    const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
    const horaMinInicio = config.horaMinInicio || '08:00';
    const horaMaxInicio = config.horaMaxInicio || '08:30';

    if (horaActual < horaMinInicio) {
      return res.status(400).json({ 
        error: `No puedes iniciar el día antes de las ${horaMinInicio}`,
        codigo: 'HORA_DEMASIADO_TEMPRANA',
        horaMinima: horaMinInicio,
        horaActual: horaActual
      });
    }

    if (horaActual > horaMaxInicio) {
      return res.status(400).json({ 
        error: `La hora límite para iniciar el día es ${horaMaxInicio}. Ya pasó el horario permitido.`,
        codigo: 'HORA_FUERA_RANGO',
        horaMaxima: horaMaxInicio,
        horaActual: horaActual
      });
    }
  }

  const ahora = new Date();
  const nuevoDia = {
    id: generarID(),
    fecha: ahora.toISOString().split('T')[0], // YYYY-MM-DD
    inicio: ahora.toISOString(),
    cierre: null,
    estado: 'abierto',
    ventas: [],
    total: 0
  };

  bd.dias.push(nuevoDia);

  if (guardarBaseDatos(bd)) {
    res.status(201).json(nuevoDia);
  } else {
    res.status(500).json({ error: 'Error al iniciar el día' });
  }
});


/**
 * POST /api/dias/cerrar - Cierra el día de trabajo abierto (solo admin)
 * Validaciones: horario permitido para cierre, debe haber un día abierto
 */
app.post('/api/dias/cerrar', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  bd.dias = bd.dias || [];

  const dia = bd.dias.find(d => d.estado === 'abierto');
  if (!dia) {
    return res.status(400).json({ 
      error: 'No hay un día abierto para cerrar.',
      codigo: 'NO_HAY_DIA_ABIERTO'
    });
  }

  // Validar horario mínimo de cierre si está configurado
  const config = bd.configuracionPOS || {};
  if (config.controlHorarios) {
    const ahora = new Date();
    const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
    const horaMinCierre = config.horaMinCierre || '17:00';

    if (horaActual < horaMinCierre) {
      return res.status(400).json({ 
        error: `No puedes cerrar el día antes de las ${horaMinCierre}`,
        codigo: 'HORA_CIERRE_TEMPRANA',
        horaMinima: horaMinCierre,
        horaActual: horaActual
      });
    }
  }

  // Calcular total real del día sumando las ventas actualmente registradas
  dia.ventas = dia.ventas || [];
  const ventasDelDia = bd.ventas.filter(v => dia.ventas.includes(v.id));
  const totalCalculado = ventasDelDia.reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);

  dia.cierre = new Date().toISOString();
  dia.estado = 'cerrado';
  dia.total = parseFloat(totalCalculado.toFixed(2));

  if (guardarBaseDatos(bd)) {
    res.json(dia);
  } else {
    res.status(500).json({ error: 'Error al cerrar el día' });
  }
});


/**
 * GET /api/dias - Lista todos los días (historial) (solo admin)
 */
app.get('/api/dias', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  res.json(bd.dias || []);
});


/**
 * GET /api/dias/:id - Obtiene detalles de un día (incluye las ventas completas)
 */
app.get('/api/dias/:id', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  const dia = (bd.dias || []).find(d => d.id === req.params.id);
  if (!dia) return res.status(404).json({ error: 'Día no encontrado' });

  // Adjuntar objetos completos de ventas para fácil consulta
  const ventas = bd.ventas.filter(v => (dia.ventas || []).includes(v.id));
  res.json(Object.assign({}, dia, { ventas }));
});

// ============================================================================
// GESTIÓN DE REPARACIONES
// ============================================================================

/**
 * GET /api/tecnicos - lista técnicos (solo admin)
 */
app.get('/api/tecnicos', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  bd.tecnicos = bd.tecnicos || [];
  res.json(bd.tecnicos);
});

/**
 * POST /api/tecnicos - crear técnico (solo admin)
 * Body: { nombre, telefono, email }
 */
app.post('/api/tecnicos', verificarAutenticacion, (req, res) => {
  const { nombre, telefono, email } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  const bd = leerBaseDatos();
  bd.tecnicos = bd.tecnicos || [];
  const t = { id: generarID(), nombre, telefono: telefono||'', email: email||'' };
  bd.tecnicos.push(t);
  if (guardarBaseDatos(bd)) res.status(201).json(t); else res.status(500).json({ error: 'Error guardando técnico' });
});

/**
 * GET /api/clientes - lista clientes (solo admin)
 */
app.get('/api/clientes', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  bd.clientes = bd.clientes || [];
  res.json(bd.clientes);
});

/**
 * POST /api/clientes - crear cliente (solo admin)
 */
app.post('/api/clientes', verificarAutenticacion, (req, res) => {
  const { nombre, telefono, email, cedula } = req.body;
  if (!nombre || !telefono) return res.status(400).json({ error: 'Nombre y teléfono requeridos' });
  const bd = leerBaseDatos();
  bd.clientes = bd.clientes || [];
  const c = { id: generarID(), nombre, telefono, email: email||'', cedula: cedula||'' };
  bd.clientes.push(c);
  if (guardarBaseDatos(bd)) res.status(201).json(c); else res.status(500).json({ error: 'Error guardando cliente' });
});

/**
 * POST /api/reparaciones - crear reparación (solo admin/POS)
 */
app.post('/api/reparaciones', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  bd.reparaciones = bd.reparaciones || [];
  bd.historial_reparaciones = bd.historial_reparaciones || [];

  const data = req.body || {};
  // validar mínimos
  if (!data.cliente || !data.equipo || !data.tipo) return res.status(400).json({ error: 'Faltan campos requeridos' });

  // Si viene cliente simple, permitimos crear/usar
  let clienteObj = data.cliente;
  if (clienteObj.id) {
    bd.clientes = bd.clientes || [];
    clienteObj = bd.clientes.find(c => c.id === clienteObj.id) || clienteObj;
  } else {
    // crear cliente rápido
    bd.clientes = bd.clientes || [];
    const nuevoCliente = { id: generarID(), nombre: clienteObj.nombre || 'Cliente', telefono: clienteObj.telefono||'', email: clienteObj.email||'', cedula: clienteObj.cedula||'' };
    bd.clientes.push(nuevoCliente);
    clienteObj = nuevoCliente;
  }

  const reparacion = {
    id: generarID(),
    orden: 'R-' + Date.now().toString().slice(-6),
    fechaIngreso: new Date().toISOString(),
    cliente: { id: clienteObj.id, nombre: clienteObj.nombre, telefono: clienteObj.telefono, email: clienteObj.email },
    tipo: data.tipo,
    equipo: data.equipo || '',
    marca: data.marca || '',
    modelo: data.modelo || '',
    serial: data.serial || '',
    estadoFisico: data.estadoFisico || '',
    accesorios: data.accesorios || '',
    fallaReportada: data.fallaReportada || '',
    observacionesTecnico: data.observacionesTecnico || '',
    diagnostico: data.diagnostico || '',
    costoEstimado: parseFloat((data.costoEstimado||0)),
    garantia: data.garantia || '',
    fechaEntregaEstimada: data.fechaEntregaEstimada || null,
    tecnicoAsignado: data.tecnicoAsignado || null,
    fotos: data.fotos || [],
    estado: 'Recibido',
    seguimiento: []
  };

  bd.reparaciones.push(reparacion);

  // Historial: registro inicial
  const hist = { id: generarID(), reparacionId: reparacion.id, fecha: new Date().toISOString(), estado: 'Recibido', nota: 'Equipo recibido en taller', usuario: req.session.usuario || 'sistema' };
  bd.historial_reparaciones.push(hist);

  if (guardarBaseDatos(bd)) {
    res.status(201).json({ reparacion, historial: [hist] });
  } else {
    res.status(500).json({ error: 'Error guardando reparación' });
  }
});

/**
 * GET /api/reparaciones - lista reparaciones (admin)
 * Soporta query params: q (busqueda), estado, tecnico, fechaFrom, fechaTo
 */
app.get('/api/reparaciones', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  bd.reparaciones = bd.reparaciones || [];
  let lista = bd.reparaciones.slice();

  const { q, estado, tecnico, fechaFrom, fechaTo } = req.query;
  if (q) {
    const qq = q.toLowerCase();
    lista = lista.filter(r => (r.cliente && (r.cliente.nombre||'').toLowerCase().includes(qq)) || (r.orden||'').toLowerCase().includes(qq) || (r.equipo||'').toLowerCase().includes(qq));
  }
  if (estado) lista = lista.filter(r => r.estado === estado);
  if (tecnico) lista = lista.filter(r => r.tecnicoAsignado === tecnico);
  if (fechaFrom) lista = lista.filter(r => new Date(r.fechaIngreso) >= new Date(fechaFrom));
  if (fechaTo) lista = lista.filter(r => new Date(r.fechaIngreso) <= new Date(fechaTo));

  res.json(lista);
});

/**
 * GET /api/reparaciones/:id - detalles de reparación (incluye historial)
 */
app.get('/api/reparaciones/:id', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  const reparacion = (bd.reparaciones||[]).find(r => r.id === req.params.id || r.orden === req.params.id);
  if (!reparacion) return res.status(404).json({ error: 'Reparación no encontrada' });
  const historial = (bd.historial_reparaciones||[]).filter(h => h.reparacionId === reparacion.id);
  res.json(Object.assign({}, reparacion, { historial }));
});

/**
 * PUT /api/reparaciones/:id - actualizar reparación (estado, diagnóstico, etc.)
 */
app.put('/api/reparaciones/:id', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  bd.reparaciones = bd.reparaciones || [];
  bd.historial_reparaciones = bd.historial_reparaciones || [];
  const idx = bd.reparaciones.findIndex(r => r.id === req.params.id || r.orden === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Reparación no encontrada' });

  const existente = bd.reparaciones[idx];
  const body = req.body || {};

  // Campos actualizables
  const campos = ['diagnostico','observacionesTecnico','costoEstimado','garantia','fechaEntregaEstimada','tecnicoAsignado','estado','fotos'];
  campos.forEach(c => { if (body[c] !== undefined) existente[c] = body[c]; });

  // Si cambia el estado, registrar historial
  if (body.estado && body.estado !== existente.estado) {
    const h = { id: generarID(), reparacionId: existente.id, fecha: new Date().toISOString(), estado: body.estado, nota: body.nota || ('Cambio de estado a ' + body.estado), usuario: req.session.usuario || 'sistema' };
    bd.historial_reparaciones.push(h);
    existente.estado = body.estado;
  }

  // guardar
  if (guardarBaseDatos(bd)) {
    const historial = bd.historial_reparaciones.filter(h => h.reparacionId === existente.id);
    res.json(Object.assign({}, existente, { historial }));
  } else {
    res.status(500).json({ error: 'Error actualizando reparación' });
  }
});

/**
 * GET /api/reparaciones/estado/:id - estado público (para QR)
 */
app.get('/api/reparaciones/estado/:id', (req, res) => {
  const bd = leerBaseDatos();
  const reparacion = (bd.reparaciones||[]).find(r => r.id === req.params.id || r.orden === req.params.id);
  if (!reparacion) return res.status(404).json({ error: 'No encontrada' });
  res.json({ id: reparacion.id, orden: reparacion.orden, estado: reparacion.estado, fechaIngreso: reparacion.fechaIngreso, fechaEntregaEstimada: reparacion.fechaEntregaEstimada || null });
});

/**
 * DELETE /api/reparaciones/:id - Eliminar reparación
 */
app.delete('/api/reparaciones/:id', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  bd.reparaciones = bd.reparaciones || [];
  const idx = bd.reparaciones.findIndex(r => r.id === req.params.id || r.orden === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Reparación no encontrada' });

  const reparacionEliminada = bd.reparaciones.splice(idx, 1)[0];

  // También eliminar su historial
  bd.historial_reparaciones = bd.historial_reparaciones || [];
  bd.historial_reparaciones = bd.historial_reparaciones.filter(h => h.reparacionId !== reparacionEliminada.id);

  if (guardarBaseDatos(bd)) {
    res.json({ mensaje: 'Reparación eliminada', reparacion: reparacionEliminada });
  } else {
    res.status(500).json({ error: 'Error eliminando reparación' });
  }
});

/**
 * PUT /api/tecnicos/:id - Actualizar técnico
 */
app.put('/api/tecnicos/:id', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  bd.tecnicos = bd.tecnicos || [];
  const idx = bd.tecnicos.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Técnico no encontrado' });

  const { nombre, telefono, email } = req.body;
  const tecnico = bd.tecnicos[idx];

  if (nombre) tecnico.nombre = nombre;
  if (telefono !== undefined) tecnico.telefono = telefono;
  if (email !== undefined) tecnico.email = email;

  if (guardarBaseDatos(bd)) {
    res.json(tecnico);
  } else {
    res.status(500).json({ error: 'Error actualizando técnico' });
  }
});

/**
 * DELETE /api/tecnicos/:id - Eliminar técnico
 */
app.delete('/api/tecnicos/:id', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  bd.tecnicos = bd.tecnicos || [];
  const idx = bd.tecnicos.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Técnico no encontrado' });

  const tecnicoEliminado = bd.tecnicos.splice(idx, 1)[0];

  if (guardarBaseDatos(bd)) {
    res.json({ mensaje: 'Técnico eliminado', tecnico: tecnicoEliminado });
  } else {
    res.status(500).json({ error: 'Error eliminando técnico' });
  }
});



// ============================================================================
// ENDPOINTS DE CATEGORÍAS (CRUD)
// ============================================================================

/**
 * GET /api/categorias - Obtener todas las categorías
 */
app.get('/api/categorias', (req, res) => {
  const bd = leerBaseDatos();
  res.json(bd.categorias || []);
});

/**
 * POST /api/categorias - Crear una categoría (solo admin)
 * Body: { nombre }
 */
app.post('/api/categorias', verificarAutenticacion, (req, res) => {
  const { nombre } = req.body;
  if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'Nombre inválido' });

  const bd = leerBaseDatos();
  bd.categorias = bd.categorias || [];

  // Evitar duplicados (case-insensitive)
  if (bd.categorias.find(c => c.toLowerCase() === nombre.toLowerCase())) {
    return res.status(400).json({ error: 'La categoría ya existe' });
  }

  bd.categorias.push(nombre);

  if (guardarBaseDatos(bd)) {
    res.status(201).json({ nombre });
  } else {
    res.status(500).json({ error: 'Error al guardar la categoría' });
  }
});

/**
 * PUT /api/categorias/:nombre - Editar una categoría (solo admin)
 * Body: { nuevo }
 */
app.put('/api/categorias/:nombre', verificarAutenticacion, (req, res) => {
  const viejo = req.params.nombre;
  const nuevo = req.body.nuevo;
  if (!nuevo || !nuevo.trim()) return res.status(400).json({ error: 'Nombre nuevo inválido' });

  const bd = leerBaseDatos();
  bd.categorias = bd.categorias || [];

  const idx = bd.categorias.findIndex(c => c === viejo || c.toLowerCase() === (viejo || '').toLowerCase());
  if (idx === -1) return res.status(404).json({ error: 'Categoría no encontrada' });

  // Evitar conflicto con otro nombre existente
  if (bd.categorias.find((c, i) => i !== idx && c.toLowerCase() === nuevo.toLowerCase())) {
    return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
  }

  // Actualizar productos que usen la categoría
  bd.productos = (bd.productos || []).map(p => {
    if (p.categoria === bd.categorias[idx]) p.categoria = nuevo;
    return p;
  });

  bd.categorias[idx] = nuevo;

  if (guardarBaseDatos(bd)) {
    res.json({ viejo, nuevo });
  } else {
    res.status(500).json({ error: 'Error al actualizar la categoría' });
  }
});

/**
 * DELETE /api/categorias/:nombre - Eliminar categoría (solo admin)
 */
app.delete('/api/categorias/:nombre', verificarAutenticacion, (req, res) => {
  const nombre = req.params.nombre;
  const bd = leerBaseDatos();
  bd.categorias = bd.categorias || [];

  const idx = bd.categorias.findIndex(c => c === nombre || c.toLowerCase() === (nombre || '').toLowerCase());
  if (idx === -1) return res.status(404).json({ error: 'Categoría no encontrada' });

  // Opcional: no eliminamos productos, solo limpiamos la categoría en productos que la usen
  bd.productos = (bd.productos || []).map(p => {
    if (p.categoria === bd.categorias[idx]) p.categoria = '';
    return p;
  });

  bd.categorias.splice(idx, 1);

  if (guardarBaseDatos(bd)) {
    res.json({ mensaje: 'Categoría eliminada' });
  } else {
    res.status(500).json({ error: 'Error al eliminar la categoría' });
  }
});

// ============================================================================
// ENDPOINTS DE PEDIDOS (GENERADOS POR STOCK BAJO)
// ============================================================================

/**
 * POST /api/pedidos - Crear un pedido a partir de una lista de items (solo admin)
 * Body: { items: [{ id, nombre, categoria, stock, precio, sugerido }], umbral }
 */
app.post('/api/pedidos', verificarAutenticacion, (req, res) => {
  const { items, umbral, proveedorId } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Items inválidos' });

  const bd = leerBaseDatos();
  bd.pedidos = bd.pedidos || [];

  const nuevo = {
    id: generarID(),
    fecha: new Date().toISOString(),
    items: items.map(i => ({ id: i.id, nombre: i.nombre, categoria: i.categoria, stock: i.stock, precio: i.precio, sugerido: i.sugerido })),
    umbral: umbral || null,
    usuario: req.session.usuario || 'admin',
    proveedorId: proveedorId || null,
    estado: 'creado'
  };

  bd.pedidos.push(nuevo);
  if (guardarBaseDatos(bd)) {
    res.status(201).json(nuevo);
  } else {
    res.status(500).json({ error: 'Error guardando pedido' });
  }
});

/**
 * GET /api/pedidos - Lista pedidos (solo admin)
 */
app.get('/api/pedidos', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  res.json(bd.pedidos || []);
});

/**
 * GET /api/pedidos/:id - Obtener pedido por id (solo admin)
 */
app.get('/api/pedidos/:id', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  const p = (bd.pedidos || []).find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Pedido no encontrado' });
  res.json(p);
});

// ============================================================================
// ENDPOINTS DE CONFIGURACIÓN
// ============================================================================

/**
 * GET /api/config - Obtener configuración del sistema (solo admin)
 */
app.get('/api/config', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  res.json(bd.config || {});
});

/**
 * PUT /api/config - Actualizar configuración del sistema (solo admin)
 * Body: { siteName, version, currency }
 */
app.put('/api/config', verificarAutenticacion, (req, res) => {
  const { siteName, version, currency } = req.body;
  const bd = leerBaseDatos();
  bd.config = bd.config || {};

  if (siteName !== undefined) bd.config.siteName = siteName;
  if (version !== undefined) bd.config.version = version;
  if (currency !== undefined) bd.config.currency = currency;

  if (guardarBaseDatos(bd)) {
    res.json(bd.config);
  } else {
    res.status(500).json({ error: 'Error al guardar configuración' });
  }
});

/**
 * POST /api/admin/password - Cambiar contraseña de admin (solo admin)
 * Body: { current, nuevo }
 */
app.post('/api/admin/password', verificarAutenticacion, (req, res) => {
  const { current, nuevo } = req.body;
  if (!nuevo || nuevo.length < 4) return res.status(400).json({ error: 'Contraseña nueva inválida (mín 4 caracteres)' });

  const bd = leerBaseDatos();
  if (current !== bd.admin.password) return res.status(400).json({ error: 'Contraseña actual incorrecta' });

  bd.admin.password = nuevo;
  if (guardarBaseDatos(bd)) {
    res.json({ mensaje: 'Contraseña actualizada' });
  } else {
    res.status(500).json({ error: 'Error al actualizar contraseña' });
  }
});

/**
 * GET /api/db/export - Descargar db.json (solo admin)
 */
app.get('/api/db/export', verificarAutenticacion, (req, res) => {
  res.download(DB_PATH, 'db.json', (err) => {
    if (err) console.error('Error enviando db.json:', err);
  });
});

/**
 * POST /api/db/reset - Resetear la base de datos a valores por defecto (solo admin)
 * Body: { confirm: true }
 */
app.post('/api/db/reset', verificarAutenticacion, (req, res) => {
  const { confirm } = req.body;
  if (!confirm) return res.status(400).json({ error: 'Confirmación requerida' });

  const bd = crearBaseDatosVacia();
  if (guardarBaseDatos(bd)) {
    res.json({ mensaje: 'Base de datos reiniciada' });
  } else {
    res.status(500).json({ error: 'Error al resetear la base de datos' });
  }
});

// ============================================================================
// ENDPOINTS DE REEMBOLSOS (CRUD)
// ============================================================================

/**
 * GET /api/reembolsos - Obtiene todos los reembolsos
 */
app.get('/api/reembolsos', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  res.json(bd.reembolsos || []);
});

/**
 * POST /api/reembolsos - Crear nuevo reembolso
 * Body: { idVenta, cliente, motivo, monto, notas }
 */
app.post('/api/reembolsos', verificarAutenticacion, (req, res) => {
  const { idVenta, cliente, motivo, monto, notas } = req.body;

  if (!cliente || !cliente.nombre || !motivo || monto === undefined) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const bd = leerBaseDatos();
  const nuevoReembolso = {
    id: generarID(),
    idVenta: idVenta || null,
    cliente: {
      nombre: cliente.nombre.trim(),
      email: cliente.email || '',
      telefono: cliente.telefono || ''
    },
    motivo,
    monto: parseFloat(monto),
    notas: notas || '',
    estado: 'pendiente',
    fechaCreacion: new Date().toISOString(),
    fechaAprobacion: null
  };

  bd.reembolsos = bd.reembolsos || [];
  bd.reembolsos.push(nuevoReembolso);

  if (guardarBaseDatos(bd)) {
    res.status(201).json(nuevoReembolso);
  } else {
    res.status(500).json({ error: 'Error al crear reembolso' });
  }
});

/**
 * PUT /api/reembolsos/:id - Actualizar estado de reembolso
 * Body: { estado } - 'pendiente', 'aprobado', 'rechazado'
 */
app.put('/api/reembolsos/:id', verificarAutenticacion, (req, res) => {
  const { estado } = req.body;
  const estadosValidos = ['pendiente', 'aprobado', 'rechazado'];

  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  const bd = leerBaseDatos();
  const reembolso = bd.reembolsos.find(r => r.id === req.params.id);

  if (!reembolso) {
    return res.status(404).json({ error: 'Reembolso no encontrado' });
  }

  reembolso.estado = estado;
  if (estado === 'aprobado') {
    reembolso.fechaAprobacion = new Date().toISOString();
  }

  if (guardarBaseDatos(bd)) {
    res.json(reembolso);
  } else {
    res.status(500).json({ error: 'Error al actualizar reembolso' });
  }
});

/**
 * DELETE /api/reembolsos/:id - Eliminar reembolso
 */
app.delete('/api/reembolsos/:id', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  const indice = bd.reembolsos.findIndex(r => r.id === req.params.id);

  if (indice === -1) {
    return res.status(404).json({ error: 'Reembolso no encontrado' });
  }

  bd.reembolsos.splice(indice, 1);

  if (guardarBaseDatos(bd)) {
    res.json({ mensaje: 'Reembolso eliminado' });
  } else {
    res.status(500).json({ error: 'Error al eliminar reembolso' });
  }
});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tienda.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ============================================================================
// MANEJO DE ERRORES
// ============================================================================

// ============================================================================
// ENDPOINTS DE PROVEEDORES (CRUD)
// ============================================================================

/**
 * GET /api/proveedores - Obtiene todos los proveedores
 */
app.get('/api/proveedores', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  res.json(bd.proveedores || []);
});

/**
 * POST /api/proveedores - Crear nuevo proveedor
 * Body: { nombre, contacto, telefono, email, direccion, ciudad }
 */
app.post('/api/proveedores', verificarAutenticacion, (req, res) => {
  const {
    nombre,
    contacto,
    telefono,
    telefono2,
    nit,
    email,
    direccion,
    ciudad,
    categorias,
    metodos_pago,
    notas,
    estado
  } = req.body || {};

  if (!nombre || !contacto) {
    return res.status(400).json({ error: 'Nombre y contacto son requeridos' });
  }

  const bd = leerBaseDatos();
  if (!bd.proveedores) bd.proveedores = [];

  const nuevoProveedor = {
    id: generarID(),
    nombre: nombre.trim(),
    contacto: contacto.trim(),
    nit: nit || '',
    telefono: telefono || '',
    telefono2: telefono2 || '',
    email: email || '',
    direccion: direccion || '',
    ciudad: ciudad || '',
    categorias: categorias || '',
    metodos_pago: metodos_pago || '',
    notas: notas || '',
    estado: estado || 'Activo',
    fechaCreacion: new Date().toISOString()
  };

  bd.proveedores.push(nuevoProveedor);

  if (guardarBaseDatos(bd)) {
    res.json(nuevoProveedor);
  } else {
    res.status(500).json({ error: 'Error al guardar proveedor' });
  }
});

/**
 * GET /api/proveedores/:id - Obtener proveedor por ID
 */
app.get('/api/proveedores/:id', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  const proveedor = (bd.proveedores || []).find(p => p.id === req.params.id);
  if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado' });
  res.json(proveedor);
});

/**
 * PUT /api/proveedores/:id - Actualizar proveedor
 * Body: { nombre, contacto, telefono, email, direccion, ciudad }
 */
app.put('/api/proveedores/:id', verificarAutenticacion, (req, res) => {
  const {
    nombre,
    contacto,
    telefono,
    telefono2,
    nit,
    email,
    direccion,
    ciudad,
    categorias,
    metodos_pago,
    notas,
    estado
  } = req.body || {};
  const bd = leerBaseDatos();
  const idx = (bd.proveedores || []).findIndex(p => p.id === req.params.id);

  if (idx === -1) return res.status(404).json({ error: 'Proveedor no encontrado' });

  bd.proveedores[idx] = {
    ...bd.proveedores[idx],
    nombre: nombre ? nombre.trim() : bd.proveedores[idx].nombre,
    contacto: contacto ? contacto.trim() : bd.proveedores[idx].contacto,
    nit: nit !== undefined ? nit : bd.proveedores[idx].nit,
    telefono: telefono !== undefined ? telefono : bd.proveedores[idx].telefono,
    telefono2: telefono2 !== undefined ? telefono2 : bd.proveedores[idx].telefono2,
    email: email !== undefined ? email : bd.proveedores[idx].email,
    direccion: direccion !== undefined ? direccion : bd.proveedores[idx].direccion,
    ciudad: ciudad !== undefined ? ciudad : bd.proveedores[idx].ciudad,
    categorias: categorias !== undefined ? categorias : bd.proveedores[idx].categorias,
    metodos_pago: metodos_pago !== undefined ? metodos_pago : bd.proveedores[idx].metodos_pago,
    notas: notas !== undefined ? notas : bd.proveedores[idx].notas,
    estado: estado !== undefined ? estado : bd.proveedores[idx].estado
  };

  if (guardarBaseDatos(bd)) {
    res.json(bd.proveedores[idx]);
  } else {
    res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
});

/**
 * DELETE /api/proveedores/:id - Eliminar proveedor
 */
app.delete('/api/proveedores/:id', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  const idx = (bd.proveedores || []).findIndex(p => p.id === req.params.id);

  if (idx === -1) return res.status(404).json({ error: 'Proveedor no encontrado' });

  const eliminado = bd.proveedores.splice(idx, 1)[0];

  if (guardarBaseDatos(bd)) {
    res.json({ mensaje: 'Proveedor eliminado', proveedor: eliminado });
  } else {
    res.status(500).json({ error: 'Error al eliminar proveedor' });
  }
});

// ============================================================================
// ENDPOINTS DE ÓRDENES DE COMPRA
// ============================================================================

/**
 * GET /api/ordenes-compra - Obtiene todas las órdenes de compra
 */
app.get('/api/ordenes-compra', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  const ordenes = (bd.ordenes_compra || []).map(orden => {
    const detalles = (bd.detalles_orden || []).filter(d => d.orden_id === orden.id);
    return { ...orden, detalles };
  });
  res.json(ordenes);
});

/**
 * POST /api/ordenes-compra - Crear nueva orden de compra
 * Body: { proveedor_id, detalles: [{producto_id, producto_nombre, cantidad, costo_unitario}], fecha_estimada }
 */
app.post('/api/ordenes-compra', verificarAutenticacion, (req, res) => {
  const { proveedor_id, detalles, fecha_estimada } = req.body;

  if (!proveedor_id || !detalles || detalles.length === 0) {
    return res.status(400).json({ error: 'Proveedor e items son requeridos' });
  }

  const bd = leerBaseDatos();

  // Validar proveedor existe
  const proveedorIdx = (bd.proveedores || []).findIndex(p => p.id === proveedor_id);
  if (proveedorIdx === -1) {
    return res.status(404).json({ error: 'Proveedor no encontrado' });
  }

  if (!bd.ordenes_compra) bd.ordenes_compra = [];
  if (!bd.detalles_orden) bd.detalles_orden = [];

  const orden = {
    id: generarID(),
    proveedor_id,
    proveedor_nombre: bd.proveedores[proveedorIdx].nombre,
    fecha_creacion: new Date().toISOString(),
    fecha_estimada: fecha_estimada || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    estado: 'pendiente',
    total: 0
  };

  // Calcular total y crear detalles
  let total = 0;
  const detallesInsert = detalles.map(d => {
    const detalle = {
      id: generarID(),
      orden_id: orden.id,
      producto_id: d.producto_id,
      producto_nombre: d.producto_nombre || '',
      cantidad: parseInt(d.cantidad) || 0,
      costo_unitario: parseFloat(d.costo_unitario) || 0,
      subtotal: (parseInt(d.cantidad) || 0) * (parseFloat(d.costo_unitario) || 0)
    };
    total += detalle.subtotal;
    return detalle;
  });

  orden.total = total;

  bd.ordenes_compra.push(orden);
  bd.detalles_orden.push(...detallesInsert);

  if (guardarBaseDatos(bd)) {
    res.json({ ...orden, detalles: detallesInsert });
  } else {
    res.status(500).json({ error: 'Error al crear orden' });
  }
});

/**
 * GET /api/ordenes-compra/:id - Obtener orden por ID
 */
app.get('/api/ordenes-compra/:id', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  const orden = (bd.ordenes_compra || []).find(o => o.id === req.params.id);
  
  if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

  const detalles = (bd.detalles_orden || []).filter(d => d.orden_id === orden.id);
  res.json({ ...orden, detalles });
});

/**
 * PUT /api/ordenes-compra/:id/estado - Actualizar estado de orden
 * Body: { estado } - ('pendiente', 'en_proceso', 'recibido', 'cancelado')
 */
app.put('/api/ordenes-compra/:id/estado', verificarAutenticacion, (req, res) => {
  const { estado } = req.body;
  const estadosValidos = ['pendiente', 'en_proceso', 'recibido', 'cancelado'];

  if (!estado || !estadosValidos.includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  const bd = leerBaseDatos();
  const idx = (bd.ordenes_compra || []).findIndex(o => o.id === req.params.id);

  if (idx === -1) return res.status(404).json({ error: 'Orden no encontrada' });

  bd.ordenes_compra[idx].estado = estado;

  // Si estado es 'recibido', actualizar stock de productos
  if (estado === 'recibido') {
    const detalles = (bd.detalles_orden || []).filter(d => d.orden_id === req.params.id);
    
    detalles.forEach(detalle => {
      const prodIdx = (bd.productos || []).findIndex(p => p.id === detalle.producto_id);
      if (prodIdx !== -1) {
        bd.productos[prodIdx].stock = (bd.productos[prodIdx].stock || 0) + detalle.cantidad;
      }
    });
  }

  if (guardarBaseDatos(bd)) {
    const detalles = (bd.detalles_orden || []).filter(d => d.orden_id === req.params.id);
    res.json({ ...bd.ordenes_compra[idx], detalles });
  } else {
    res.status(500).json({ error: 'Error al actualizar orden' });
  }
});

/**
 * DELETE /api/ordenes-compra/:id - Eliminar orden de compra
 */
app.delete('/api/ordenes-compra/:id', verificarAutenticacion, (req, res) => {
  const bd = leerBaseDatos();
  const idx = (bd.ordenes_compra || []).findIndex(o => o.id === req.params.id);

  if (idx === -1) return res.status(404).json({ error: 'Orden no encontrada' });

  // Eliminar también los detalles
  bd.detalles_orden = (bd.detalles_orden || []).filter(d => d.orden_id !== req.params.id);
  const eliminada = bd.ordenes_compra.splice(idx, 1)[0];

  if (guardarBaseDatos(bd)) {
    res.json({ mensaje: 'Orden eliminada', orden: eliminada });
  } else {
    res.status(500).json({ error: 'Error al eliminar orden' });
  }
});

// ============================================================================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ============================================================================
// INICIAR SERVIDOR
// ============================================================================

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════╗
  ║   SERVIDOR FERRETERÍA EN EJECUCIÓN         ║
  ║   http://localhost:${PORT}                 ║
  ║                                            ║
  ║   Tienda: http://localhost:${PORT}/        ║
  ║   Admin:  http://localhost:${PORT}/admin   ║
  ║                                            ║
  ║                                            ║         
  ║                                            ║
  ╚════════════════════════════════════════════╝
  `);
});

/**
 * POST /api/productos/:id/reabastecer - Aumenta stock de un producto (solo admin)
 * Body: { cantidad }
 */
app.post('/api/productos/:id/reabastecer', verificarAutenticacion, (req, res) => {
  const cantidad = parseInt(req.body.cantidad || 0);
  if (isNaN(cantidad) || cantidad <= 0) return res.status(400).json({ error: 'Cantidad inválida' });

  const bd = leerBaseDatos();
  const idx = (bd.productos || []).findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Producto no encontrado' });

  bd.productos[idx].stock = parseInt((bd.productos[idx].stock || 0)) + cantidad;

  if (guardarBaseDatos(bd)) {
    res.json({ mensaje: 'Stock actualizado', producto: bd.productos[idx] });
  } else {
    res.status(500).json({ error: 'Error al actualizar stock' });
  }
});