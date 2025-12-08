-- Migración 005: Agregar campo tipo a detalle_ventas para manejar venta/reservación por zapato individual

-- Agregar columna tipo a detalle_ventas
ALTER TABLE detalle_ventas ADD COLUMN tipo TEXT DEFAULT 'venta' CHECK (tipo IN ('venta', 'reservacion'));

-- Actualizar registros existentes (por defecto serán 'venta')
UPDATE detalle_ventas SET tipo = 'venta' WHERE tipo IS NULL;

-- Hacer que el campo no sea NULL para nuevos registros
-- (SQLite no soporta ALTER COLUMN NOT NULL directamente, así que se hace con el CHECK constraint)