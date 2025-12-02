# 📋 Documentación de Nuevos Campos - Base de Datos

## 🆕 Campos Agregados

### Tabla `zapato`
- **`codigo`** (TEXT, UNIQUE): Campo para identificar únicamente cada zapato
  - Utilizado para búsquedas rápidas y control de inventario
  - Puede ser generado automáticamente o asignado manualmente
  - Tiene índice único para evitar duplicados

### Tabla `zapato_detalle`
- **`precio_vendido`** (REAL, OPTIONAL): Precio final al que se vendió el zapato
  - Se actualiza cuando se confirma una venta
  - Permite rastrear descuentos y rebajas aplicadas
  - Es opcional hasta que se realice la venta

## 🔄 API Endpoints Actualizados

### POST `/api/zapatos` - Crear zapato
**Nuevos campos en el body:**
```json
{
  "codigo": "ZAP-001", // Opcional, único
  "precio_vendido": 45000 // Opcional, para el detalle
}
```

### GET `/api/zapatos` - Listar zapatos
**Campos adicionales en la respuesta:**
```json
{
  "codigo": "ZAP-001",
  "precio_vendido": 45000
}
```

### GET `/api/zapatos/codigo/:codigo` - Buscar por código
**Nuevo endpoint específico para búsqueda por código:**
```
GET /api/zapatos/codigo/ZAP-001
```

### GET `/api/zapatos/search/:term` - Búsqueda general
**Ahora incluye búsqueda por código** además de marca y modelo.

### PUT `/api/zapatos/:id/precio-vendido` - Actualizar precio vendido
**Nuevo endpoint para actualizar el precio final de venta:**
```json
{
  "precio_vendido": 45000
}
```

## 📊 Casos de Uso

### Campo `codigo`
1. **Búsqueda rápida**: Los vendedores pueden buscar zapatos por código
2. **Control de inventario**: Facilita la identificación única
3. **Etiquetado**: Se puede imprimir en etiquetas para los zapatos
4. **Trazabilidad**: Permite seguimiento completo del producto

### Campo `precio_vendido`
1. **Registro de rebajas**: Cuando se aplican descuentos
2. **Análisis de márgenes**: Comparar precio de venta vs precio de compra
3. **Historial de precios**: Mantener registro de precios finales
4. **Reportes de ventas**: Generar informes precisos de ingresos

## 🚀 Migración Realizada

Los campos fueron agregados mediante migración sin afectar datos existentes:
- Campo `codigo` permite valores NULL para registros existentes
- Campo `precio_vendido` permite valores NULL hasta que se realice la venta
- Se creó índice único para el campo `codigo`

## 💡 Recomendaciones de Uso

1. **Códigos sugeridos**: 
   - Formato: `MARCA-MODELO-###` (ej: NIKE-AIRMAX-001)
   - O simplemente numérico secuencial: ZAP-001, ZAP-002, etc.

2. **Precio vendido**:
   - Actualizar solo cuando se confirme la venta
   - Útil para casos donde el precio final difiere del precio de venta sugerido
   - Permite análisis de descuentos aplicados

3. **Búsquedas**:
   - Usar `/codigo/:codigo` para búsquedas exactas
   - Usar `/search/:term` para búsquedas generales que incluyen el código