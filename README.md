# 📋 Módulo de Gestión de Día de Trabajo - Punto de Venta

## ✅ Estado del Proyecto
**IMPLEMENTACIÓN COMPLETADA** - v1.0.0

Sistema completo de control de horarios operativos para punto de venta con validaciones de servidor y cliente.

---

## 🏗️ Arquitectura

### 🔧 Backend (Server.js)

#### 1. Validaciones de Horario en Inicio de Día
**Endpoint:** `POST /api/dias/iniciar`

- ✓ Valida hora actual contra `horaMinInicio` y `horaMaxInicio`
- ✓ Retorna error si está fuera del rango permitido
- ✓ Mensajes claros con hora actual y horarios permitidos

#### 2. Validaciones de Horario en Cierre de Día
**Endpoint:** `POST /api/dias/cerrar`

- ✓ Valida que la hora sea mayor o igual a `horaMinCierre`
- ✓ Retorna error si se intenta cerrar antes de hora

#### 3. Bloqueo de Ventas sin Día Abierto
**Endpoint:** `POST /api/ventas`

- ✓ Verifica que `diaAbierto === true`
- ✓ Retorna código de error `DIA_NO_INICIADO` si no hay día abierto
- ✓ Impide cualquier venta fuera del horario operativo

#### 4. Endpoints de Configuración y Estado

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/configuracion/horarios` | Obtiene configuración de horarios | No |
| `GET` | `/api/dias/estado` | Obtiene estado actual del día | No |
| `POST` | `/api/config` | Guarda configuración | Admin |
| `GET` | `/api/config` | Obtiene configuración general | Sí |

#### 5. Estructura de Base de Datos

```json
{
  "configuracionPOS": {
    "controlHorarios": true,
    "horaMinInicio": "08:00",
    "horaMaxInicio": "08:30",
    "horaMinCierre": "17:00"
  }
}
```

---

## 🎨 Frontend - Punto de Venta

### 📄 Archivo: `/public/js/modulo-dia.js`

Módulo JavaScript independiente que maneja toda la lógica del día de trabajo.

#### Funciones Principales

| Función | Descripción |
|---------|-------------|
| `inicializarModuloDia()` | Carga al abrir POS |
| `cargarEstadoDia()` | Obtiene estado del servidor cada 30s |
| `cargarConfiguracionHorarios()` | Carga horarios configurados |
| `actualizarInterfazDia()` | Bloquea/desbloquea UI según estado |
| `iniciarDiaPV()` | Inicia día con validaciones |
| `cerrarDiaPV()` | Cierra día con validaciones |
| `validarHoraInicio()` | Verifica si está en horario permitido |
| `validarHoraCierre()` | Verifica hora mínima de cierre |
| `puedeHacerVenta()` | Valida antes de procesar venta |

### 🖥️ Interfaz Visual - Módulo de Día

```
┌─────────────────────────────────────────┐
│  🟢 Día Abierto / 🔴 Día Cerrado       │
│  [Iniciar Día] [Cerrar Día]            │
│  ⏰ Horarios: 08:00 - 08:30             │
└─────────────────────────────────────────┘
```

#### Estados del Sistema

| Estado | Indicador | Módulos de Venta | Botón Activo |
|--------|-----------|------------------|--------------|
| **Abierto** | 🟢 Verde | Habilitados | Cerrar Día |
| **Cerrado** | 🔴 Rojo | Bloqueados | Iniciar Día |

#### Tipos de Mensajes

| Tipo | Color | Ejemplo |
|------|-------|---------|
| ✓ Éxito | Verde | "Sistema operativo" |
| ⚠️ Error | Rojo | "Debes iniciar el día..." |
| ⏰ Validación | Naranja | "No puedes iniciar antes de..." |

### 🎨 Bloqueo Visual de POS

```css
.seccion-productos.bloqueado,
.seccion-carrito.bloqueado {
  opacity: 0.5;
  pointer-events: none;
  position: relative;
}

.seccion-productos.bloqueado::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
}
```

### ✅ Validación en Completar Venta

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

## ⚙️ Frontend - Panel de Admin

### 🎛️ Sección de Configuración de Horarios

**Ubicación:** Tab "Configuración" del panel admin

#### Controles Disponibles

- ☑️ **Activar Control de Horarios** (checkbox)
- ⏰ **Hora Mínima de Inicio** (input time)
- ⏰ **Hora Máxima de Inicio** (input time)
- ⏰ **Hora Mínima para Cerrar** (input time)

#### Botones

- 💾 **Guardar Horarios**
- 🔄 **Cargar Valores**

#### Funciones JavaScript

```javascript
cargarConfiguracionHorarios()  // Obtiene config del servidor
guardarConfiguracionHorarios() // Guarda nuevas configuraciones
```

---

## 🎯 Flujo de Operación

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

## 🔐 Seguridad

### Validaciones del Servidor (NO pueden bypassearse desde cliente)

- ✓ Hora del servidor (no del cliente)
- ✓ Validación en cada venta
- ✓ Control de horarios por BD
- ✓ Solo admin puede cambiar config

### Bloqueos de Cliente (UX)

- ✓ Interfaz grisada si no hay día abierto
- ✓ Botones deshabilitados
- ✓ Validación antes de enviar al servidor
- ✓ Mensajes claros al usuario

---

## 📊 Respuestas de API

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

## 🚀 Próximas Mejoras (Opcionales)

### 📄 Reporte de Cierre de Día
- PDF con resumen del día
- Total vendido, cantidad de transacciones
- Horario de apertura/cierre

### 📜 Historial de Horarios
- Audit log de cambios de configuración
- Quién y cuándo cambió horarios

### 🔄 Sincronización de Múltiples Cajas
- Solo una caja puede estar abierta
- Validación de ID de caja

### 🔔 Notificaciones
- Alerta cuando faltan 15 min para cierre
- Confirmación antes de cerrar con ventas pendientes

### 📱 Móvil Responsive
- Optimizar para tablets/móviles
- Botones más grandes y accesibles

---

## 📝 Notas Técnicas

| Aspecto | Detalle |
|---------|---------|
| **Intervalo de actualización** | 30 segundos |
| **Formato de hora** | ISO 8601 (UTC) |
| **Zona horaria** | Configurada en cliente (navegador) |
| **Base de datos** | `db.json` |
| **Persistencia** | Automática en cada cambio |
| **Versión** | 1.0.0 |
| **Fecha** | 2 de Diciembre de 2025 |

---

## 📦 Instalación y Uso

### Requisitos Previos
- Node.js v14+
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone [URL_DEL_REPO]

# Instalar dependencias
npm install

# Iniciar el servidor
npm start
```

### Configuración Inicial

1. Acceder al panel de administración
2. Ir a la sección "Configuración"
3. Configurar los horarios operativos
4. Activar el control de horarios
5. Guardar cambios

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 👤 Autor

**Sistema de Gestión Ferretería**

- GitHub: [@tuusuario](https://github.com/tuusuario)
- Email: contacto@example.com

---

## 🙏 Agradecimientos

- A todos los contribuidores del proyecto
- Comunidad de desarrolladores de Node.js
- Stack Overflow por resolver dudas técnicas

---

**Made with ❤️ for retail businesses**
