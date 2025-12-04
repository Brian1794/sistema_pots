/**
 * MÓDULO DE GESTIÓN DE DÍA DE TRABAJO - PUNTO DE VENTA
 * Maneja la apertura/cierre de caja, validaciones de horario y bloqueo del sistema
 */

// Variables globales
let estadoDiaActual = null;
let configuracionHorarios = null;
let timerActualizacion = null;
let ultimoEstadoDiaAbierto = null;

/**
 * Inicializar módulo al cargar la página
 */
function inicializarModuloDia() {
  cargarEstadoDia();
  cargarConfiguracionHorarios();
  actualizarInterfazDia();
  
  // Actualizar estado cada 30 segundos
  timerActualizacion = setInterval(() => {
    cargarEstadoDia();
    actualizarInterfazDia();
  }, 30000);
}

/**
 * Cargar estado actual del día desde el servidor
 */
async function cargarEstadoDia() {
  try {
    const response = await fetch('/api/dias/estado');
    const data = await response.json();
    estadoDiaActual = data;
    console.log('Estado día:', estadoDiaActual);
  } catch (error) {
    console.error('Error cargando estado del día:', error);
  }
}

/**
 * Cargar configuración de horarios desde el servidor
 */
async function cargarConfiguracionHorarios() {
  try {
    const response = await fetch('/api/configuracion/horarios');
    const data = await response.json();
    configuracionHorarios = data;
    console.log('Configuración horarios:', configuracionHorarios);

    // Actualizar resumen visual de horario si existe el contenedor
    const detalle = document.getElementById('detalleHorarioPV');
    if (detalle) {
      if (!configuracionHorarios.controlHorarios) {
        detalle.textContent = 'Control de horarios desactivado: puedes iniciar y cerrar en cualquier momento.';
      } else {
        detalle.textContent = `Control de horarios activo · Inicio ${configuracionHorarios.horaMinInicio} - ${configuracionHorarios.horaMaxInicio} · Cierre desde ${configuracionHorarios.horaMinCierre}`;
      }
    }
  } catch (error) {
    console.error('Error cargando configuración:', error);
  }
}

/**
 * Actualizar interfaz según el estado del día
 */
function actualizarInterfazDia() {
  if (!estadoDiaActual) return;

  const diaAbierto = estadoDiaActual.diaAbierto;
  const gestionDia = document.getElementById('gestionDiaPV');
  const estadoDiv = document.getElementById('estadoDiaPV');
  const infoDiaDiv = document.getElementById('infoDiaActualPV');
  const btnIniciar = document.getElementById('btnIniciarDiaPV');
  const btnCerrar = document.getElementById('btnCerrarDiaPV');
  const moduloVentas = document.querySelector('.seccion-productos');
  // Solo bloqueamos las partes operativas del lado derecho, no el contenedor completo
  const bloqueVentasDerecha = document.querySelector('.carrito-seccion');
  const bloqueCliente = document.querySelector('.cliente-seccion');
  const bloqueBotones = document.querySelector('.botones-pv');

  if (!gestionDia) return;

  // Actualizar estado visual
  if (diaAbierto) {
    estadoDiv.innerHTML = '🟢 Día Abierto';
    estadoDiv.className = 'estado-badge estado-abierto';
    btnIniciar.disabled = true;
    btnCerrar.disabled = false;

    // Información del día en curso
    if (infoDiaDiv) {
      const diaData = estadoDiaActual.dia;
      if (diaData && diaData.inicio) {
        const fecha = new Date(diaData.inicio);
        const fechaStr = fecha.toLocaleDateString('es-CO', { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' });
        const horaStr = fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        infoDiaDiv.textContent = `Día en curso · ${fechaStr} · Inicio ${horaStr}`;
      } else {
        infoDiaDiv.textContent = 'Día en curso';
      }
    }

    // Habilitar módulos de venta
    if (moduloVentas) moduloVentas.classList.remove('bloqueado');
    if (bloqueVentasDerecha) bloqueVentasDerecha.classList.remove('bloqueado');
    if (bloqueCliente) bloqueCliente.classList.remove('bloqueado');
    if (bloqueBotones) bloqueBotones.classList.remove('bloqueado');

    // Solo mostrar mensaje si el estado cambió
    if (ultimoEstadoDiaAbierto === false) {
      mostrarMensajeEstado('Sistema operativo ✓ Día abierto', 'exito');
    }
  } else {
    estadoDiv.innerHTML = '🔴 Día Cerrado';
    estadoDiv.className = 'estado-badge estado-cerrado';
    if (infoDiaDiv) {
      infoDiaDiv.textContent = 'Sin día activo';
    }

    btnIniciar.disabled = false;
    btnCerrar.disabled = true;

    // Bloquear módulos de venta, pero dejar libre el panel de gestión de día
    if (moduloVentas) moduloVentas.classList.add('bloqueado');
    if (bloqueVentasDerecha) bloqueVentasDerecha.classList.add('bloqueado');
    if (bloqueCliente) bloqueCliente.classList.add('bloqueado');
    if (bloqueBotones) bloqueBotones.classList.add('bloqueado');

    if (ultimoEstadoDiaAbierto === true || ultimoEstadoDiaAbierto === null) {
      mostrarMensajeEstado(
        '⚠️ Día cerrado. Inicia el día de trabajo para comenzar a operar.',
        'error'
      );
    }
  }

  ultimoEstadoDiaAbierto = diaAbierto;
}

/**
 * Iniciar día de trabajo
 */
async function iniciarDiaPV() {
  try {
    // Validar horarios si está activado
    if (configuracionHorarios && configuracionHorarios.controlHorarios) {
      const validacion = validarHoraInicio();
      if (!validacion.valido) {
        mostrarMensajeEstado(validacion.mensaje, 'error');
        return;
      }
    }

    const response = await fetch('/api/dias/iniciar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const data = await response.json();

    if (response.ok) {
      estadoDiaActual = { diaAbierto: true, dia: data };
      actualizarInterfazDia();
      mostrarMensajeEstado('✓ Día iniciado correctamente', 'exito');
      console.log('Día iniciado:', data);
    } else {
      mostrarMensajeEstado(data.error || 'Error al iniciar el día', 'error');
      console.error('Error:', data);
    }
  } catch (error) {
    console.error('Error iniciando día:', error);
    mostrarMensajeEstado('Error al conectar con el servidor', 'error');
  }
}

/**
 * Cerrar día de trabajo
 */
async function cerrarDiaPV() {
  // Confirmar cierre
  if (!confirm('¿Está seguro de cerrar el día de trabajo?\nNo podrá registrar más ventas hasta iniciar un nuevo día.')) {
    return;
  }

  try {
    // Validar horario de cierre si está activado
    if (configuracionHorarios && configuracionHorarios.controlHorarios) {
      const validacion = validarHoraCierre();
      if (!validacion.valido) {
        mostrarMensajeEstado(validacion.mensaje, 'error');
        return;
      }
    }

    const response = await fetch('/api/dias/cerrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const data = await response.json();

    if (response.ok) {
      estadoDiaActual = { diaAbierto: false, dia: null };
      actualizarInterfazDia();
      mostrarMensajeEstado(`✓ Día cerrado. Total: $${data.total.toLocaleString('es-CO')}`, 'exito');
      console.log('Día cerrado:', data);
    } else {
      mostrarMensajeEstado(data.error || 'Error al cerrar el día', 'error');
      console.error('Error:', data);
    }
  } catch (error) {
    console.error('Error cerrando día:', error);
    mostrarMensajeEstado('Error al conectar con el servidor', 'error');
  }
}

/**
 * Validar si es hora permitida para iniciar el día
 */
function validarHoraInicio() {
  if (!configuracionHorarios || !configuracionHorarios.controlHorarios) {
    return { valido: true };
  }

  const ahora = new Date();
  const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
  const horaMin = configuracionHorarios.horaMinInicio;
  const horaMax = configuracionHorarios.horaMaxInicio;

  if (horaActual < horaMin) {
    return {
      valido: false,
      mensaje: `⏰ No puedes iniciar el día antes de las ${horaMin}. Hora actual: ${horaActual}`
    };
  }

  if (horaActual > horaMax) {
    return {
      valido: false,
      mensaje: `⏰ La hora límite para iniciar el día es ${horaMax}. Ya pasó el horario permitido. Hora actual: ${horaActual}`
    };
  }

  return { valido: true };
}

/**
 * Validar si es hora permitida para cerrar el día
 */
function validarHoraCierre() {
  if (!configuracionHorarios || !configuracionHorarios.controlHorarios) {
    return { valido: true };
  }

  const ahora = new Date();
  const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
  const horaMin = configuracionHorarios.horaMinCierre;

  if (horaActual < horaMin) {
    return {
      valido: false,
      mensaje: `⏰ No puedes cerrar el día antes de las ${horaMin}. Hora actual: ${horaActual}`
    };
  }

  return { valido: true };
}

/**
 * Mostrar mensaje de estado
 */
function mostrarMensajeEstado(mensaje, tipo = 'info') {
  // Si existe la función global de mensajes del POS, reutilizarla para mantener estilo
  if (typeof mostrarMensajePV === 'function') {
    mostrarMensajePV(mensaje, tipo === 'exito' ? 'exito' : tipo);
    return;
  }

  const mensajePV = document.getElementById('mensajePV');
  if (!mensajePV) return;

  mensajePV.textContent = mensaje;
  mensajePV.className = `mensaje-pv mensaje-${tipo}`;
  mensajePV.style.display = 'block';

  // Auto-ocultar en 5 segundos si es error o éxito
  if (tipo !== 'info') {
    setTimeout(() => {
      mensajePV.style.display = 'none';
    }, 5000);
  }
}

/**
 * Verificar si puede hacer venta (día abierto)
 */
function puedeHacerVenta() {
  return estadoDiaActual && estadoDiaActual.diaAbierto;
}

// Ejecutar al cargar el módulo
document.addEventListener('DOMContentLoaded', inicializarModuloDia);
