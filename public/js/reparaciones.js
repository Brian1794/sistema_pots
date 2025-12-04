// ============================================================================
// GESTIÓN DE REPARACIONES - JavaScript (NUEVO - LIMPIO)
// ============================================================================

// Estado global
let reparacionesLista = [];
let tecnicosLista = [];
let reparacionesFiltradas = [];

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Inicializando módulo de reparaciones...');
  
  // Autenticar primero
  await autenticar();
  
  // Cargar datos
  await cargarDatos();
  actualizarTablasReparaciones();
  actualizarTablasTecnicos();
  
  // Event listeners para formularios
  const formAgregarReparacion = document.getElementById('formAgregarReparacion');
  if (formAgregarReparacion) {
    formAgregarReparacion.addEventListener('submit', guardarReparacion);
  }
  
  const formAgregarTecnico = document.getElementById('formAgregarTecnico');
  if (formAgregarTecnico) {
    formAgregarTecnico.addEventListener('submit', guardarTecnico);
  }
  
  // Event listeners para búsqueda
  const buscadorReparaciones = document.getElementById('buscadorReparaciones');
  if (buscadorReparaciones) {
    buscadorReparaciones.addEventListener('input', filtrarReparaciones);
  }
  
  const filtroEstadoRep = document.getElementById('filtroEstadoRep');
  if (filtroEstadoRep) {
    filtroEstadoRep.addEventListener('change', filtrarReparaciones);
  }
  
  const buscadorTecnicos = document.getElementById('buscadorTecnicos');
  if (buscadorTecnicos) {
    buscadorTecnicos.addEventListener('input', filtrarTecnicos);
  }
});

// ============================================================================
// AUTENTICACIÓN
// ============================================================================

async function autenticar() {
  try {
    const resVerify = await fetch('/api/verificar-sesion');
    const verificacion = await resVerify.json();
    
    if (verificacion.autenticado) {
      console.log('✅ Ya autenticado como:', verificacion.usuario);
      return;
    }
    
    // Intentar login con credenciales por defecto
    console.log('🔐 Intentando autenticación...');
    const resLogin = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: 'admin', password: 'admin123' })
    });

    if (resLogin.ok) {
      console.log('✅ Autenticación exitosa');
    } else {
      console.warn('⚠️ Fallo en autenticación');
    }
  } catch (error) {
    console.error('❌ Error durante autenticación:', error);
  }
}

// ============================================================================
// CARGAR DATOS
// ============================================================================

async function cargarDatos() {
  try {
    console.log('📡 Cargando datos de la API...');
    const [resReparaciones, resTecnicos] = await Promise.all([
      fetch('/api/reparaciones'),
      fetch('/api/tecnicos')
    ]);

    reparacionesLista = resReparaciones.ok ? await resReparaciones.json() : [];
    tecnicosLista = resTecnicos.ok ? await resTecnicos.json() : [];
    
    console.log(`✅ Cargadas ${reparacionesLista.length} reparaciones y ${tecnicosLista.length} técnicos`);
    
    // Llenar selector de técnicos
    const selectTecnico = document.getElementById('selectTecnico');
    if (selectTecnico) {
      selectTecnico.innerHTML = '<option value="">-- Sin asignar --</option>';
      tecnicosLista.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.nombre;
        selectTecnico.appendChild(opt);
      });
    }
  } catch (error) {
    console.error('❌ Error cargando datos:', error);
    mostrarMensaje('Error cargando datos', 'error');
  }
}

// ============================================================================
// GESTIÓN DE TABS
// ============================================================================

function cambiarTabRep(tabName) {
  // Remover clase activa de todos los tabs
  document.querySelectorAll('.tab-contenido-rep').forEach(tab => {
    tab.classList.remove('activo');
  });
  
  // Remover clase activa de todos los botones
  document.querySelectorAll('.tab-btn-rep').forEach(btn => {
    btn.classList.remove('activo');
  });
  
  // Agregar clase activa al tab seleccionado
  const tabId = `tab-${tabName}-rep`;
  const tab = document.getElementById(tabId);
  if (tab) {
    tab.classList.add('activo');
  }
  
  // Marcar botón correspondiente
  const botones = document.querySelectorAll('.tab-btn-rep');
  const indice = ['agregar', 'gestionar', 'tecnicos'].indexOf(tabName);
  if (indice >= 0 && botones[indice]) {
    botones[indice].classList.add('activo');
  }
}

// ============================================================================
// REPARACIONES - FORMULARIO
// ============================================================================

async function guardarReparacion(event) {
  event.preventDefault();
  
  const clienteNombre = document.getElementById('clienteNombre');
  const clienteTelefono = document.getElementById('clienteTelefono');
  const tipoEquipo = document.getElementById('tipoEquipo');
  const fallaReportada = document.getElementById('fallaReportada');

  if (!clienteNombre?.value || !clienteTelefono?.value || !tipoEquipo?.value || !fallaReportada?.value) {
    mostrarMensaje('⚠️ Completa los campos requeridos', 'error');
    return;
  }

  const reparacion = {
    cliente: {
      nombre: clienteNombre.value,
      telefono: clienteTelefono.value,
      email: document.getElementById('clienteEmail')?.value || '',
      cedula: document.getElementById('clienteCedula')?.value || ''
    },
    tipo: tipoEquipo.value,
    equipo: tipoEquipo.options[tipoEquipo.selectedIndex]?.text || tipoEquipo.value,
    marca: document.getElementById('marca')?.value || '',
    modelo: document.getElementById('modelo')?.value || '',
    serial: document.getElementById('serial')?.value || '',
    estadoFisico: document.getElementById('estadoFisico')?.value || '',
    accesorios: document.getElementById('accesorios')?.value || '',
    fallaReportada: fallaReportada.value,
    costoEstimado: parseFloat(document.getElementById('costoEstimado')?.value || 0),
    garantia: parseInt(document.getElementById('garantia')?.value || 0),
    fechaEntregaEstimada: document.getElementById('fechaEntregaEstimada')?.value || null,
    tecnicoAsignado: document.getElementById('selectTecnico')?.value || null
  };

  try {
    const response = await fetch('/api/reparaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reparacion)
    });

    if (response.ok) {
      const resultado = await response.json();
      mostrarMensaje(`✅ Reparación #${resultado.reparacion.orden} creada`, 'exito');
      event.target.reset();
      await cargarDatos();
      actualizarTablasReparaciones();
      cambiarTabRep('gestionar');
    } else {
      const error = await response.json();
      mostrarMensaje(error.error || 'Error guardando', 'error');
    }
  } catch (error) {
    mostrarMensaje('❌ Error: ' + error.message, 'error');
  }
}

function limpiarFormularioReparacion() {
  const form = document.getElementById('formAgregarReparacion');
  if (form) form.reset();
}

// ============================================================================
// REPARACIONES - TABLA
// ============================================================================

function actualizarTablasReparaciones() {
  reparacionesFiltradas = [...reparacionesLista];
  renderizarTablaReparaciones(reparacionesFiltradas);
}

function renderizarTablaReparaciones(reparaciones) {
  const tbody = document.getElementById('reparacionesTabla');
  if (!tbody) return;

  if (reparaciones.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="sin-datos">📭 No hay reparaciones</td></tr>';
    return;
  }

  tbody.innerHTML = reparaciones.map(r => {
    const fechaIngreso = new Date(r.fechaIngreso).toLocaleDateString('es-CO');
    const fechaEntrega = r.fechaEntregaEstimada 
      ? new Date(r.fechaEntregaEstimada).toLocaleDateString('es-CO') 
      : '-';

    return `
      <tr>
        <td><strong>${r.orden}</strong></td>
        <td>${r.cliente?.nombre || '-'}</td>
        <td>${r.equipo || '-'}</td>
        <td>${r.tipo || '-'}</td>
        <td><span class="estado-badge">${r.estado}</span></td>
        <td>${fechaIngreso}</td>
        <td>${fechaEntrega}</td>
        <td class="acciones-columna">
          <button class="btn btn-small" onclick="verReparacion('${r.id}')">👁️</button>
          <button class="btn btn-small" onclick="editarReparacion('${r.id}')">✏️</button>
          <button class="btn btn-small btn-danger" onclick="eliminarReparacion('${r.id}')">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

function filtrarReparaciones() {
  const busqueda = document.getElementById('buscadorReparaciones')?.value.toLowerCase() || '';
  const estado = document.getElementById('filtroEstadoRep')?.value || '';

  reparacionesFiltradas = reparacionesLista.filter(r => {
    const coincideBusqueda = !busqueda || 
      r.cliente?.nombre?.toLowerCase().includes(busqueda) ||
      r.orden?.toLowerCase().includes(busqueda) ||
      r.equipo?.toLowerCase().includes(busqueda);
    
    const coincideEstado = !estado || r.estado === estado;
    
    return coincideBusqueda && coincideEstado;
  });

  renderizarTablaReparaciones(reparacionesFiltradas);
}

function verReparacion(id) {
  const reparacion = reparacionesLista.find(r => r.id === id);
  if (!reparacion) {
    mostrarMensaje('❌ Reparación no encontrada', 'error');
    return;
  }

  const detalle = `
    <div class="modal activo">
      <div class="modal-contenido modal-max-600">
        <button class="btn-cerrar-modal" onclick="this.closest('.modal').remove()">✕</button>
        <h3>🔧 Reparación #${reparacion.orden}</h3>

        <div class="pad-20">
          <section class="mb-15">
            <h4>📋 Cliente</h4>
            <p><strong>Nombre:</strong> ${reparacion.cliente?.nombre || '-'}</p>
            <p><strong>Teléfono:</strong> ${reparacion.cliente?.telefono || '-'}</p>
            <p><strong>Email:</strong> ${reparacion.cliente?.email || '-'}</p>
          </section>

          <section class="mb-15">
            <h4>🔧 Equipo</h4>
            <p><strong>Tipo:</strong> ${reparacion.tipo || '-'}</p>
            <p><strong>Equipo:</strong> ${reparacion.equipo || '-'}</p>
            <p><strong>Marca:</strong> ${reparacion.marca || '-'}</p>
            <p><strong>Modelo:</strong> ${reparacion.modelo || '-'}</p>
            <p><strong>Serial:</strong> ${reparacion.serial || '-'}</p>
          </section>

          <section class="mb-15">
            <h4>⚙️ Falla</h4>
            <p><strong>Reportada:</strong> ${reparacion.fallaReportada || '-'}</p>
            <p><strong>Accesorios:</strong> ${reparacion.accesorios || '-'}</p>
          </section>

          <section class="mb-15">
            <h4>💰 Info Reparación</h4>
            <p><strong>Estado:</strong> ${reparacion.estado}</p>
            <p><strong>Técnico:</strong> ${obtenerNombreTecnico(reparacion.tecnicoAsignado)}</p>
            <p><strong>Costo:</strong> $${reparacion.costoEstimado || 0}</p>
            <p><strong>Garantía:</strong> ${reparacion.garantia || 0} días</p>
            <p><strong>Fecha Ingreso:</strong> ${new Date(reparacion.fechaIngreso).toLocaleDateString('es-CO')}</p>
          </section>

          <div class="modal-footer-actions" style="display:flex; gap:10px; justify-content:flex-end;">
            <button onclick="cambiarEstadoReparacion('${reparacion.id}')" class="btn btn-primario">📍 Cambiar Estado</button>
            <button onclick="this.closest('.modal').remove()" class="btn btn-secundario">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const container = document.createElement('div');
  container.innerHTML = detalle;
  document.body.appendChild(container);
}

function obtenerNombreTecnico(tecnicoId) {
  if (!tecnicoId) return 'Sin asignar';
  const tecnico = tecnicosLista.find(t => t.id === tecnicoId);
  return tecnico ? tecnico.nombre : 'Sin asignar';
}

function cambiarEstadoReparacion(id) {
  const reparacion = reparacionesLista.find(r => r.id === id);
  if (!reparacion) return;

  const estados = ['Recibido', 'Diagnóstico', 'En reparación', 'Listo', 'Entregado'];
  const nuevoEstado = prompt(`Estados: ${estados.join(', ')}\n\nNuevo estado:`, reparacion.estado);
  
  if (nuevoEstado && nuevoEstado !== reparacion.estado) {
    actualizarEstadoReparacion(id, nuevoEstado);
  }
}

async function actualizarEstadoReparacion(id, nuevoEstado) {
  try {
    const response = await fetch(`/api/reparaciones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    });

    if (response.ok) {
      mostrarMensaje(`✅ Estado actualizado`, 'exito');
      await cargarDatos();
      actualizarTablasReparaciones();
    } else {
      const error = await response.json();
      mostrarMensaje(error.error || 'Error', 'error');
    }
  } catch (error) {
    mostrarMensaje('❌ Error: ' + error.message, 'error');
  }
}

function editarReparacion(id) {
  const reparacion = reparacionesLista.find(r => r.id === id);
  if (!reparacion) return;

  document.getElementById('clienteNombre').value = reparacion.cliente?.nombre || '';
  document.getElementById('clienteTelefono').value = reparacion.cliente?.telefono || '';
  document.getElementById('clienteEmail').value = reparacion.cliente?.email || '';
  document.getElementById('clienteCedula').value = reparacion.cliente?.cedula || '';
  
  document.getElementById('tipoEquipo').value = reparacion.tipo || '';
  document.getElementById('marca').value = reparacion.marca || '';
  document.getElementById('modelo').value = reparacion.modelo || '';
  document.getElementById('serial').value = reparacion.serial || '';
  document.getElementById('estadoFisico').value = reparacion.estadoFisico || '';
  document.getElementById('accesorios').value = reparacion.accesorios || '';
  document.getElementById('fallaReportada').value = reparacion.fallaReportada || '';
  
  document.getElementById('costoEstimado').value = reparacion.costoEstimado || 0;
  document.getElementById('garantia').value = reparacion.garantia || 0;
  document.getElementById('selectTecnico').value = reparacion.tecnicoAsignado || '';

  cambiarTabRep('agregar');
}

async function eliminarReparacion(id) {
  if (!confirm('¿Eliminar esta reparación?')) return;

  try {
    const response = await fetch(`/api/reparaciones/${id}`, { method: 'DELETE' });

    if (response.ok) {
      mostrarMensaje('✅ Reparación eliminada', 'exito');
      await cargarDatos();
      actualizarTablasReparaciones();
    } else {
      const error = await response.json();
      mostrarMensaje(error.error || 'Error', 'error');
    }
  } catch (error) {
    mostrarMensaje('❌ Error: ' + error.message, 'error');
  }
}

// ============================================================================
// TÉCNICOS - FORMULARIO
// ============================================================================

async function guardarTecnico(event) {
  event.preventDefault();
  
  const nombreTecnico = document.getElementById('nombreTecnico');
  if (!nombreTecnico?.value) {
    mostrarMensaje('⚠️ Ingresa el nombre', 'error');
    return;
  }

  const tecnico = {
    nombre: nombreTecnico.value,
    telefono: document.getElementById('telefonoTecnico')?.value || '',
    email: document.getElementById('emailTecnico')?.value || ''
  };

  try {
    const response = await fetch('/api/tecnicos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tecnico)
    });

    if (response.ok) {
      const resultado = await response.json();
      mostrarMensaje(`✅ Técnico "${resultado.nombre}" agregado`, 'exito');
      event.target.reset();
      await cargarDatos();
      actualizarTablasTecnicos();
    } else {
      const error = await response.json();
      mostrarMensaje(error.error || 'Error', 'error');
    }
  } catch (error) {
    mostrarMensaje('❌ Error: ' + error.message, 'error');
  }
}

function limpiarFormularioTecnico() {
  const form = document.getElementById('formAgregarTecnico');
  if (form) form.reset();
}

// ============================================================================
// TÉCNICOS - TABLA
// ============================================================================

function actualizarTablasTecnicos() {
  const tbody = document.getElementById('tecnicosTabla');
  if (!tbody) return;

  if (tecnicosLista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="sin-datos">📭 No hay técnicos</td></tr>';
    return;
  }

  tbody.innerHTML = tecnicosLista.map(t => `
    <tr>
      <td>${t.nombre}</td>
      <td>${t.telefono || '-'}</td>
      <td>${t.email || '-'}</td>
      <td class="acciones-columna">
        <button class="btn btn-small" onclick="editarTecnico('${t.id}')">✏️</button>
        <button class="btn btn-small btn-danger" onclick="eliminarTecnico('${t.id}')">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function filtrarTecnicos() {
  const busqueda = document.getElementById('buscadorTecnicos')?.value.toLowerCase() || '';
  const tbody = document.getElementById('tecnicosTabla');
  if (!tbody) return;

  const filtrados = tecnicosLista.filter(t =>
    t.nombre?.toLowerCase().includes(busqueda) ||
    t.telefono?.toLowerCase().includes(busqueda) ||
    t.email?.toLowerCase().includes(busqueda)
  );

  if (filtrados.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="sin-datos">🔍 No encontrado</td></tr>';
    return;
  }

  tbody.innerHTML = filtrados.map(t => `
    <tr>
      <td>${t.nombre}</td>
      <td>${t.telefono || '-'}</td>
      <td>${t.email || '-'}</td>
      <td class="acciones-columna">
        <button class="btn btn-small" onclick="editarTecnico('${t.id}')">✏️</button>
        <button class="btn btn-small btn-danger" onclick="eliminarTecnico('${t.id}')">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function editarTecnico(id) {
  const tecnico = tecnicosLista.find(t => t.id === id);
  if (!tecnico) {
    mostrarMensaje('❌ Técnico no encontrado', 'error');
    return;
  }

  document.getElementById('nombreTecnico').value = tecnico.nombre;
  document.getElementById('telefonoTecnico').value = tecnico.telefono || '';
  document.getElementById('emailTecnico').value = tecnico.email || '';
  
  cambiarTabRep('tecnicos');
}

async function eliminarTecnico(id) {
  if (!confirm('¿Eliminar este técnico?')) return;

  try {
    const response = await fetch(`/api/tecnicos/${id}`, { method: 'DELETE' });

    if (response.ok) {
      mostrarMensaje('✅ Técnico eliminado', 'exito');
      await cargarDatos();
      actualizarTablasTecnicos();
    } else {
      const error = await response.json();
      mostrarMensaje(error.error || 'Error', 'error');
    }
  } catch (error) {
    mostrarMensaje('❌ Error: ' + error.message, 'error');
  }
}

// ============================================================================
// MENSAJES
// ============================================================================

function mostrarMensaje(texto, tipo = 'info') {
  let contenedor = document.getElementById('mensajeContenedorRep');
  if (!contenedor) {
    contenedor = document.createElement('div');
    contenedor.id = 'mensajeContenedorRep';
    contenedor.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; max-width: 400px;';
    document.body.appendChild(contenedor);
  }

  const elemento = document.createElement('div');
  elemento.textContent = texto;
  elemento.style.cssText = `
    padding: 15px 20px;
    margin-bottom: 10px;
    border-radius: 4px;
    ${tipo === 'exito' ? 'background: #4caf50; color: white;' : ''}
    ${tipo === 'error' ? 'background: #f44336; color: white;' : ''}
    ${tipo === 'info' ? 'background: #2196f3; color: white;' : ''}
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  `;

  contenedor.appendChild(elemento);

  setTimeout(() => elemento.remove(), 4000);
}
