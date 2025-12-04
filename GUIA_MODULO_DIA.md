# 📋 MÓDULO DE GESTIÓN DE DÍA DE TRABAJO - PUNTO DE VENTA

## ✅ IMPLEMENTACIÓN COMPLETADA

### 🔧 Backend (Server.js)

#### 1. **Validaciones de Horario en Inicio de Día**
- `POST /api/dias/iniciar`
- Valida hora actual contra `horaMinInicio` y `horaMaxInicio`
- Retorna error si está fuera del rango permitido
- Mensajes claros con hora actual y horarios permitidos

#### 2. **Validaciones de Horario en Cierre de Día**
- `POST /api/dias/cerrar`
- Valida que la hora sea mayor o igual a `horaMinCierre`
- Retorna error si se intenta cerrar antes de hora

#### 3. **Bloqueo de Ventas sin Día Abierto**
- `POST /api/ventas` - Verifica que `diaAbierto === true`
- Retorna código de error `DIA_NO_INICIADO` si no hay día abierto
- Impide cualquier venta fuera del horario operativo

#### 4. **Endpoints de Configuración y Estado**
- `GET /api/configuracion/horarios` - Obtiene configuración sin autenticación
- `GET /api/dias/estado` - Obtiene estado actual del día (abierto/cerrado)
- `POST /api/config` - Guarda configuración (solo admin)
- `GET /api/config` - Obtiene configuración general

#### 5. **Base de Datos**
```json
"configuracionPOS": {
  "controlHorarios": true,
  "horaMinInicio": "08:00",
  "horaMaxInicio": "08:30",
  "horaMinCierre": "17:00"
}
```

---

### 🎨 Frontend - Punto de Venta

#### 1. **Archivo: `/public/js/modulo-dia.js`**
Módulo JavaScript independiente que maneja:
- `inicializarModuloDia()` - Carga al abrir POS
- `cargarEstadoDia()` - Obtiene estado del servidor cada 30s
- `cargarConfiguracionHorarios()` - Carga horarios configurados
- `actualizarInterfazDia()` - Bloquea/desbloquea UI según estado
- `iniciarDiaPV()` - Inicia día con validaciones
- `cerrarDiaPV()` - Cierra día con validaciones
- `validarHoraInicio()` - Verifica si está en horario permitido
- `validarHoraCierre()` - Verifica hora mínima de cierre
- `puedeHacerVenta()` - Función para validar antes de procesar venta

#### 2. **Interfaz Visual - Módulo de Día**
```
┌─────────────────────────────────────────┐
│  🟢 Día Abierto / 🔴 Día Cerrado       │
│  [Iniciar Día] [Cerrar Día]            │
│  ⏰ Horarios: 08:00 - 08:30             │
└─────────────────────────────────────────┘
```

**Estados:**
- **Abierto (🟢)**: Módulos de venta habilitados, botón cerrar activo
- **Cerrado (🔴)**: Módulos de venta bloqueados visualmente, solo botón iniciar activo

**Mensajes:**
- ✓ Éxito: Verde, "Sistema operativo"
- ⚠️ Error: Rojo, "Debes iniciar el día..."
- ⏰ Validación: Naranja, "No puedes iniciar antes de..."

#### 3. **Bloqueo Visual de POS**
```css
.seccion-productos.bloqueado,
.seccion-carrito.bloqueado {
  opacity: 0.5;
  pointer-events: none;
  /* Overlay translúcido */
}
```

#### 4. **Validación en Completar Venta**
```javascript
async function completarVentaPV() {
  if (!puedeHacerVenta()) {
    mostrarMensajePV('⚠️ Debes iniciar el día...', 'error');
    return;
  }
  // ... resto del código
}
```

---

### ⚙️ Frontend - Panel de Admin

#### 1. **Sección de Configuración de Horarios**
Ubicación: Tab "Configuración" del panel admin

**Controles:**
- ☑️ Activar Control de Horarios (checkbox)
- ⏰ Hora Mínima de Inicio (input time)
- ⏰ Hora Máxima de Inicio (input time)
- ⏰ Hora Mínima para Cerrar (input time)

**Botones:**
- 💾 Guardar Horarios
- 🔄 Cargar Valores

#### 2. **Funciones JavaScript**
- `cargarConfiguracionHorarios()` - Obtiene config del servidor
- `guardarConfiguracionHorarios()` - Guarda nuevas configuraciones

---

## 🎯 FLUJO DE OPERACIÓN

### 1️⃣ Administrador Configura Horarios
```
Panel Admin → Configuración → ⏰ Configuración de Horarios POS
├─ Activar/desactivar control
├─ Definir horas permitidas
└─ Guardar cambios
```

### 2️⃣ Vendedor Inicia Punto de Venta
```
POS → Estado: 🔴 Día Cerrado
├─ Módulos bloqueados (grisados)
├─ Botón "Iniciar Día" habilitado
└─ Mensaje: "Debes iniciar el día de trabajo"
```

### 3️⃣ Vendedor Intenta Iniciar Fuera de Horario
```
Click: [Iniciar Día]
├─ ❌ Fuera de horario
├─ Mensaje: "No puedes iniciar antes de las 08:00"
└─ Usuario espera o intenta en horario correcto
```

### 4️⃣ Vendedor Inicia en Horario Permitido
```
Click: [Iniciar Día] (08:15)
├─ ✓ Validación OK
├─ Estado: 🟢 Día Abierto
├─ Módulos desbloqueados
└─ Sistema listo para ventas
```

### 5️⃣ Vendedor Realiza Ventas
```
Agregar productos → Checkout
├─ Validación: puedeHacerVenta() = true
├─ Procesa venta
└─ Asocia venta al día abierto
```

### 6️⃣ Vendedor Cierra Día Fuera de Horario
```
Click: [Cerrar Día] (16:30)
├─ ❌ Antes de hora mínima (17:00)
├─ Mensaje: "No puedes cerrar antes de las 17:00"
└─ Espera hasta las 17:00+
```

### 7️⃣ Vendedor Cierra en Horario Permitido
```
Click: [Cerrar Día] (17:15)
├─ ✓ Validación OK
├─ Calcula total del día
├─ Estado: 🔴 Día Cerrado
└─ POS bloqueado nuevamente
```

---

## 🔐 SEGURIDAD

### Validaciones Servidores (NO pueden bypassearse desde cliente)
- ✓ Hora del servidor (no del cliente)
- ✓ Validación en cada venta
- ✓ Control de horarios por BD
- ✓ Solo admin puede cambiar config

### Bloqueos de Cliente (UX)
- ✓ Interfaz grisada si no hay día abierto
- ✓ Botones deshabilitados
- ✓ Validación ante de enviar al servidor
- ✓ Mensajes claros al usuario

---

## 📊 RESPUESTAS DE API

### ✅ Inicio de Día Exitoso
```json
{
  "id": "abc123xyz",
  "fecha": "2025-12-02",
  "inicio": "2025-12-02T08:15:30.000Z",
  "cierre": null,
  "estado": "abierto",
  "ventas": [],
  "total": 0
}
```

### ❌ Error: Fuera de Horario
```json
{
  "error": "No puedes iniciar el día antes de las 08:00",
  "codigo": "HORA_DEMASIADO_TEMPRANA",
  "horaMinima": "08:00",
  "horaActual": "07:45"
}
```

### ❌ Error: Día Ya Abierto
```json
{
  "error": "Ya hay un día abierto. Cierra el día actual antes de iniciar uno nuevo.",
  "codigo": "DIA_YA_ABIERTO"
}
```

### ❌ Error: Venta Sin Día Abierto
```json
{
  "error": "Debes iniciar el día de trabajo para registrar ventas.",
  "codigo": "DIA_NO_INICIADO"
}
```

---

## 🚀 PRÓXIMAS MEJORAS (Opcionales)

1. **Reporte de Cierre de Día**
   - PDF con resumen del día
   - Total vendido, cantidad de transacciones
   - Horario de apertura/cierre

2. **Historial de Horarios**
   - Audit log de cambios de configuración
   - Quién y cuándo cambió horarios

3. **Sincronización de Múltiples Cajas**
   - Solo una caja puede estar abierta
   - Validación de ID de caja

4. **Notificaciones**
   - Alerta cuando faltan 15 min para cierre
   - Confirmación antes de cerrar con ventas pendientes

5. **Móvil Responsive**
   - Optimizar para tablets/móviles
   - Botones más grandes y accesibles

---

## 📝 NOTAS TÉCNICAS

- **Intervalo de actualización**: 30 segundos
- **Hora del servidor**: ISO 8601 (UTC)
- **Zona horaria**: Configurada en cliente (navegador)
- **Base de datos**: db.json
- **Persistencia**: Automática en cada cambio

---

**Versión**: 1.0.0  
**Fecha**: 2 de Diciembre de 2025  
**Autor**: Sistema de Gestión Ferretería
