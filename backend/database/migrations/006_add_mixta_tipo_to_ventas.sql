-- Migración 006: Agregar tipo 'mixta' a la tabla ventas
-- Fecha: 2025-12-05
-- Descripción: Permitir operaciones mixtas (venta + reservación) en la tabla ventas

-- Primero eliminar la restricción CHECK existente y recrear la tabla
-- SQLite no permite modificar CHECK constraints directamente

-- Crear tabla temporal con la nueva restricción
CREATE TABLE ventas_temp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('venta', 'reservacion', 'mixta')),
    fecha DATETIME NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'cancelada', 'completada')),
    FOREIGN KEY (cliente_id) REFERENCES cliente (id)
);

-- Copiar datos existentes
INSERT INTO ventas_temp (id, cliente_id, tipo, fecha, total, estado)
SELECT id, cliente_id, tipo, fecha, total, estado FROM ventas;

-- Eliminar tabla original
DROP TABLE ventas;

-- Renombrar tabla temporal
ALTER TABLE ventas_temp RENAME TO ventas;

-- Recrear índices si los hubiera (opcional, pero recomendado para performance)
CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE INDEX idx_ventas_cliente ON ventas(cliente_id);
CREATE INDEX idx_ventas_tipo ON ventas(tipo);