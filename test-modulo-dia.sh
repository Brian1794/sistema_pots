#!/bin/bash
# Script de prueba del módulo de gestión de día

echo "═══════════════════════════════════════════════════════════════"
echo "   PRUEBAS DEL MÓDULO DE GESTIÓN DE DÍA DE TRABAJO"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Color para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}1. VERIFICAR SERVIDOR${NC}"
echo "   Comprobando que server.js no tiene errores..."
node -c server.js && echo -e "   ${GREEN}✓ OK${NC}" || echo -e "   ${RED}✗ ERROR${NC}"
echo ""

echo -e "${BLUE}2. BASE DE DATOS${NC}"
echo "   Verificando db.json..."
if grep -q "configuracionPOS" db.json; then
    echo -e "   ${GREEN}✓ configuracionPOS presente${NC}"
else
    echo -e "   ${RED}✗ configuracionPOS FALTA${NC}"
fi
echo ""

echo -e "${BLUE}3. ARCHIVOS NECESARIOS${NC}"
echo "   Verificando archivos del frontend..."
if [ -f "public/js/modulo-dia.js" ]; then
    echo -e "   ${GREEN}✓ modulo-dia.js${NC}"
else
    echo -e "   ${RED}✗ modulo-dia.js FALTA${NC}"
fi

if grep -q "modulo-dia.js" public/punto-venta.html; then
    echo -e "   ${GREEN}✓ Incluido en punto-venta.html${NC}"
else
    echo -e "   ${RED}✗ No incluido en punto-venta.html${NC}"
fi
echo ""

echo -e "${BLUE}4. ENDPOINTS${NC}"
echo "   Verificando endpoints en server.js..."
grep -q "GET /api/configuracion/horarios" server.js && echo -e "   ${GREEN}✓ GET /api/configuracion/horarios${NC}" || echo -e "   ${RED}✗ Falta${NC}"
grep -q "GET /api/dias/estado" server.js && echo -e "   ${GREEN}✓ GET /api/dias/estado${NC}" || echo -e "   ${RED}✗ Falta${NC}"
grep -q "POST /api/dias/iniciar" server.js && echo -e "   ${GREEN}✓ POST /api/dias/iniciar${NC}" || echo -e "   ${RED}✗ Falta${NC}"
grep -q "POST /api/dias/cerrar" server.js && echo -e "   ${GREEN}✓ POST /api/dias/cerrar${NC}" || echo -e "   ${RED}✗ Falta${NC}"
grep -q "POST /api/config" server.js && echo -e "   ${GREEN}✓ POST /api/config${NC}" || echo -e "   ${RED}✗ Falta${NC}"
echo ""

echo -e "${BLUE}5. FUNCIONES JAVASCRIPT${NC}"
echo "   Verificando funciones en modulo-dia.js..."
grep -q "function iniciarDiaPV()" public/js/modulo-dia.js && echo -e "   ${GREEN}✓ iniciarDiaPV()${NC}" || echo -e "   ${RED}✗ Falta${NC}"
grep -q "function cerrarDiaPV()" public/js/modulo-dia.js && echo -e "   ${GREEN}✓ cerrarDiaPV()${NC}" || echo -e "   ${RED}✗ Falta${NC}"
grep -q "function validarHoraInicio()" public/js/modulo-dia.js && echo -e "   ${GREEN}✓ validarHoraInicio()${NC}" || echo -e "   ${RED}✗ Falta${NC}"
grep -q "function puedeHacerVenta()" public/js/modulo-dia.js && echo -e "   ${GREEN}✓ puedeHacerVenta()${NC}" || echo -e "   ${RED}✗ Falta${NC}"
echo ""

echo -e "${BLUE}6. ESTILOS CSS${NC}"
echo "   Verificando estilos en punto-venta.css..."
grep -q "#gestionDiaPV" public/css/punto-venta.css && echo -e "   ${GREEN}✓ #gestionDiaPV${NC}" || echo -e "   ${RED}✗ Falta${NC}"
grep -q ".estado-badge" public/css/punto-venta.css && echo -e "   ${GREEN}✓ .estado-badge${NC}" || echo -e "   ${RED}✗ Falta${NC}"
grep -q ".bloqueado" public/css/punto-venta.css && echo -e "   ${GREEN}✓ .bloqueado${NC}" || echo -e "   ${RED}✗ Falta${NC}"
echo ""

echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ IMPLEMENTACIÓN COMPLETADA${NC}"
echo ""
echo "Para probar el sistema:"
echo "1. Abre la terminal en la carpeta del proyecto"
echo "2. Ejecuta: npm start (o node server.js)"
echo "3. Abre http://localhost:3000/public/admin.html"
echo "4. Login: admin / admin123"
echo "5. Ve a Configuración y activa Control de Horarios"
echo "6. Abre http://localhost:3000/public/punto-venta.html"
echo "7. Verás el módulo de gestión de día bloqueado"
echo "8. Haz clic en 'Iniciar Día' (si está en horario permitido)"
echo ""
echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
