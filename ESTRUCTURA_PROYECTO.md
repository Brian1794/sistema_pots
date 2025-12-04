# 🏗️ Estructura del Proyecto - Ferretería

```
ferreteria/
│
├── 📄 package.json                    # Dependencias Node.js
├── 📄 server.js                       # Servidor Express (backend)
├── 📄 db.json                         # Base de datos JSON (productos, ventas, admin)
├── 📄 start.bat                       # Script para iniciar en Windows
├── 📄 start-server.ps1                # Script PowerShell
│
├── 📁 public/                         # Archivos estáticos (frontend)
│   ├── 📄 admin.html                  # Panel administrativo
│   ├── 📄 tienda.html                 # Página de tienda
│   ├── 📄 punto-venta.html            # Sistema POS ✨ NUEVO
│   │
│   └── 📁 css/
│       ├── 📄 admin.css               # Estilos admin
│       ├── 📄 tienda.css              # Estilos tienda
│       └── 📄 punto-venta.css         # Estilos POS ✨ NUEVO
│
├── 📄 PUNTO_DE_VENTA_COMPLETADO.md    # ✨ Documentación POS
├── 📄 GUIA_DE_PRUEBA.md               # ✨ Casos de prueba
├── 📄 readme.txt                      # README original
└── 📄 DOCUMENTACION.md                # Documentación general

```

---

## 🗂️ Descripción de Archivos Clave

### Backend

#### `server.js` - Servidor Express
- **Función:** Maneja todas las rutas y API endpoints
- **Puertos:** 3000
- **Características:**
  - Sesiones con express-session
  - Rutas estáticas (public/)
  - API REST para:
    - `/api/productos` (GET, POST, PUT, DELETE)
    - `/api/ventas` (GET, POST)
    - `/api/login` (POST)
    - `/api/logout` (GET)
    - `/api/verificar-sesion` (GET)
  - Autenticación básica (admin)
  - Persistencia en BD JSON

#### `db.json` - Base de Datos
```json
{
  "admin": { usuario, password },
  "productos": [ 8 productos con stock ],
  "ventas": [ historial de ventas ]
}
```

### Frontend - Punto de Venta ✨

#### `public/punto-venta.html` - Interfaz POS
**Características:**
- Catálogo de productos en grid responsive
- Buscador en tiempo real
- Filtro por categorías dinámicas
- Carrito lateral pegajoso
- Datos del cliente
- Generador de factura profesional
- Impresión y descarga de factura

**Secciones principales:**
```html
<header>                    <!-- Encabezado con logo -->
<main>
  <section class="productos">   <!-- Grid de productos -->
  <aside class="carrito">       <!-- Carrito + cliente + factura -->
</main>
<modal id="modalCantidad">  <!-- Seleccionar cantidad -->
<modal id="modalFactura">   <!-- Vista de factura -->
```

#### `public/css/punto-venta.css` - Estilos
- Layout de 2 columnas (productos | carrito)
- Grid responsive para productos
- Tabla del carrito con edición inline
- Modal de cantidad
- Modal de factura con estilos profesionales
- Colores: Rojo/Coral (#FF6B6B)
- Responsive: Desktop → Tablet → Mobile

### Frontend - Admin

#### `public/admin.html` - Panel Administrativo
**Pestañas:**
1. **📦 Productos** - CRUD de productos
2. **💰 Ventas** - Historial con detalles
3. **⚙️ Configuración** - Info del sistema

#### `public/css/admin.css` - Estilos Admin
- Tablas con ordenamiento
- Modales para edición
- Estadísticas visuales
- Login modal (por sesión)

### Frontend - Tienda

#### `public/tienda.html` - Página Pública
- Catálogo de productos
- Información general

---

## 🔄 Flujo de Datos

```
Usuario
   ↓
Frontend (punto-venta.html)
   ↓
        [Búsqueda/Filtro]
        [Carrito]
        [Cliente]
   ↓
POST /api/ventas
   ↓
Backend (server.js)
   ↓
   ├─ Validaciones
   ├─ Actualizar stock
   └─ Guardar venta
   ↓
db.json (actualizado)
   ↓
Respuesta con venta
   ↓
Generar Factura
   ↓
Modal + Imprimir/Descargar
```

---

## 📊 Datos en BD

### Productos (8 disponibles)
```
Herramientas Manuales:
  1. Martillo de Garra ($15.99, stock: 25)
  2. Destornillador Phillips ($12.50, stock: 40)
  3. Llave Inglesa Ajustable ($11.50, stock: 21)

Fijaciones:
  4. Tornillos de Acero 2" ($8.99, stock: 150)
  5. Clavos Comunes 3" ($5.99, stock: 200)

Medición:
  6. Cinta Métrica 5m ($6.50, stock: 17)
  7. Nivel de Burbuja 60cm ($14.75, stock: 12)

Pintura:
  8. Pintura Acrílica Blanca 1L ($9.99, stock: 35)
```

### Admin Credentials
```
Usuario: admin
Contraseña: admin123
```

---

## 🚀 Iniciar Sistema

### Opción 1: Script Batch (Windows)
```powershell
.\start.bat
```

### Opción 2: PowerShell
```powershell
npm start
```

### Opción 3: Command Prompt
```cmd
cd ferreteria
npm start
```

**Servidor listo en:** `http://localhost:3000`

---

## 🌐 URLs Disponibles

| URL | Descripción |
|-----|-------------|
| `http://localhost:3000/` | Tienda pública |
| `http://localhost:3000/admin` | Panel administrativo (requiere login) |
| `http://localhost:3000/punto-venta` | Punto de Venta (requiere sesión) |

---

## 🔗 API Endpoints

### Productos
- `GET /api/productos` - Obtener todos
- `POST /api/productos` - Crear (requiere autenticación)
- `PUT /api/productos/:id` - Editar (requiere autenticación)
- `DELETE /api/productos/:id` - Eliminar (requiere autenticación)

### Ventas
- `GET /api/ventas` - Obtener todas (requiere autenticación)
- `POST /api/ventas` - Crear venta y actualizar stock

### Autenticación
- `POST /api/login` - Iniciar sesión
- `GET /api/logout` - Cerrar sesión
- `GET /api/verificar-sesion` - Verificar estado

---

## 📋 Dependencias (package.json)

```json
{
  "name": "ferreteria-app",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "express-session": "^1.17.0"
  }
}
```

---

## ✅ Características por Módulo

### Módulo POS (punto-venta.html)
- [x] Grid de productos
- [x] Buscador
- [x] Categorías
- [x] Carrito
- [x] Cálculo IVA
- [x] Datos cliente
- [x] Factura HTML
- [x] Imprimir
- [x] Descargar
- [x] Validaciones
- [x] Responsive

### Módulo Admin (admin.html)
- [x] Login
- [x] CRUD Productos
- [x] Historial Ventas
- [x] Ver Detalles Venta
- [x] Estadísticas
- [x] Logout

### Módulo Tienda (tienda.html)
- [x] Catálogo
- [x] Información

---

## 🎯 Casos de Uso

### Caso 1: Venta Rápida
```
1. Abrir /punto-venta
2. Buscar "Martillo"
3. Agregar cantidad
4. Ingresar datos cliente
5. Completar venta
6. Descargar factura
```

### Caso 2: Gestión Admin
```
1. Abrir /admin
2. Iniciar sesión
3. Crear/editar productos
4. Ver historial de ventas
```

### Caso 3: Verificar Inventario
```
1. Abrir /admin
2. Ver lista de productos en pestaña "Productos"
3. Editar stock si es necesario
```

---

## 📦 Instalación y Configuración

### Instalación de dependencias
```bash
npm install
```

### Configuración de puerto
En `server.js`, línea ~28:
```javascript
const PORT = process.env.PORT || 3000;
```

### Base de datos
Ubicación: `db.json`
- Auto-creada si no existe
- Se actualiza con cada venta/cambio

---

## 🔐 Seguridad

- ✓ Sesiones en servidor (no localStorage)
- ✓ Cookies httpOnly y sameSite
- ✓ Validación de autenticación en endpoints
- ✓ Validación de entrada
- ✓ Stock no puede ser negativo

---

## 📈 Escalabilidad

### Mejoras futuras recomendadas:
1. Migrar de `db.json` a una BD real (MongoDB, PostgreSQL)
2. Implementar JWT para sesiones distribuidas
3. Encriptación de contraseñas (bcrypt)
4. HTTPS en producción
5. Rate limiting
6. Logging completo
7. Respaldo automático de BD
8. API documentada con Swagger

---

**Sistema completo y funcional** ✨ 🛒
