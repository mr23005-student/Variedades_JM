-- Migración para agregar tablas de ventas y reservaciones
-- Fecha: 2025-12-04

-- Tabla principal de ventas
CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('venta', 'reservacion')),
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2) NOT NULL,
    estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'cancelada', 'completada')),
    notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES cliente(id)
);

-- Tabla de detalle de ventas (un registro por cada zapato individual)
CREATE TABLE IF NOT EXISTS detalle_ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id INTEGER NOT NULL,
    zapato_id INTEGER NOT NULL,
    precio_venta DECIMAL(10,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (zapato_id) REFERENCES zapato(id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_ventas_cliente_id ON ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_tipo ON ventas(tipo);
CREATE INDEX IF NOT EXISTS idx_ventas_estado ON ventas(estado);
CREATE INDEX IF NOT EXISTS idx_detalle_ventas_venta_id ON detalle_ventas(venta_id);
CREATE INDEX IF NOT EXISTS idx_detalle_ventas_zapato_id ON detalle_ventas(zapato_id);

-- Trigger para actualizar updated_at en ventas
CREATE TRIGGER IF NOT EXISTS update_ventas_timestamp
    AFTER UPDATE ON ventas
BEGIN
    UPDATE ventas SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger para actualizar estado del zapato cuando se vende
CREATE TRIGGER IF NOT EXISTS update_zapato_estado_on_venta
    AFTER INSERT ON detalle_ventas
BEGIN
    UPDATE zapato 
    SET estado = 'vendido', fecha_venta = CURRENT_DATE 
    WHERE id = NEW.zapato_id;
END;