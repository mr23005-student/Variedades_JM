const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');

const db = new sqlite3.Database('./database.sqlite');

// Validaciones para facturación
const validateFactura = [
  body('cliente_id').isInt({ min: 1 }).withMessage('ID de cliente inválido'),
  body('zapato_id').isInt({ min: 1 }).withMessage('ID de zapato inválido'),
  body('subtotal').isFloat({ min: 0 }).withMessage('Subtotal inválido'),
  body('descuento').optional().isFloat({ min: 0 }).withMessage('Descuento inválido'),
  body('total').isFloat({ min: 0 }).withMessage('Total inválido'),
  body('metodo_pago').isIn(['efectivo', 'tarjeta', 'transferencia', 'mixto']).withMessage('Método de pago inválido'),
  body('monto_efectivo').optional().isFloat({ min: 0 }).withMessage('Monto en efectivo inválido'),
  body('monto_tarjeta').optional().isFloat({ min: 0 }).withMessage('Monto en tarjeta inválido'),
  body('monto_transferencia').optional().isFloat({ min: 0 }).withMessage('Monto en transferencia inválido')
];

// GET - Obtener todas las facturas
router.get('/', (req, res) => {
  const { page = 1, limit = 10, cliente_id, fecha_desde, fecha_hasta, metodo_pago } = req.query;
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT 
      f.*,
      c.nombre as cliente_nombre,
      c.apellido as cliente_apellido,
      c.cedula as cliente_cedula,
      c.telefono as cliente_telefono,
      z.marca,
      z.modelo,
      z.talla,
      z.precio,
      z.color
    FROM facturacion f
    INNER JOIN cliente c ON f.cliente_id = c.id
    INNER JOIN zapato z ON f.zapato_id = z.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (cliente_id) {
    query += ' AND f.cliente_id = ?';
    params.push(cliente_id);
  }
  
  if (fecha_desde) {
    query += ' AND DATE(f.fecha_factura) >= ?';
    params.push(fecha_desde);
  }
  
  if (fecha_hasta) {
    query += ' AND DATE(f.fecha_factura) <= ?';
    params.push(fecha_hasta);
  }
  
  if (metodo_pago) {
    query += ' AND f.metodo_pago = ?';
    params.push(metodo_pago);
  }
  
  query += ' ORDER BY f.fecha_factura DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);
  
  db.all(query, params, (err, facturas) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener facturas', error: err.message });
    }
    
    // Contar total para paginación
    let countQuery = 'SELECT COUNT(*) as total FROM facturacion f WHERE 1=1';
    let countParams = [];
    
    if (cliente_id) {
      countQuery += ' AND f.cliente_id = ?';
      countParams.push(cliente_id);
    }
    
    if (fecha_desde) {
      countQuery += ' AND DATE(f.fecha_factura) >= ?';
      countParams.push(fecha_desde);
    }
    
    if (fecha_hasta) {
      countQuery += ' AND DATE(f.fecha_factura) <= ?';
      countParams.push(fecha_hasta);
    }
    
    if (metodo_pago) {
      countQuery += ' AND f.metodo_pago = ?';
      countParams.push(metodo_pago);
    }
    
    db.get(countQuery, countParams, (err, count) => {
      if (err) {
        return res.status(500).json({ message: 'Error al contar facturas', error: err.message });
      }
      
      res.json({
        facturas,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count.total,
          pages: Math.ceil(count.total / limit)
        }
      });
    });
  });
});

// GET - Obtener factura por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      f.*,
      c.nombre as cliente_nombre,
      c.apellido as cliente_apellido,
      c.cedula as cliente_cedula,
      c.telefono as cliente_telefono,
      c.email as cliente_email,
      c.direccion as cliente_direccion,
      z.marca,
      z.modelo,
      z.talla,
      z.precio,
      z.color,
      z.material,
      z.estado as zapato_estado,
      z.genero
    FROM facturacion f
    INNER JOIN cliente c ON f.cliente_id = c.id
    INNER JOIN zapato z ON f.zapato_id = z.id
    WHERE f.id = ?
  `;
  
  db.get(query, [id], (err, factura) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener factura', error: err.message });
    }
    
    if (!factura) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    
    res.json(factura);
  });
});

// POST - Crear nueva factura
router.post('/', validateFactura, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { 
    cliente_id, 
    zapato_id, 
    subtotal, 
    descuento = 0, 
    total, 
    metodo_pago,
    monto_efectivo = 0,
    monto_tarjeta = 0,
    monto_transferencia = 0,
    observaciones 
  } = req.body;
  
  // Verificar que el cliente existe
  db.get('SELECT id FROM cliente WHERE id = ?', [cliente_id], (err, cliente) => {
    if (err) {
      return res.status(500).json({ message: 'Error al verificar cliente', error: err.message });
    }
    
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    // Verificar que el zapato existe
    db.get('SELECT id FROM zapato WHERE id = ?', [zapato_id], (err, zapato) => {
      if (err) {
        return res.status(500).json({ message: 'Error al verificar zapato', error: err.message });
      }
      
      if (!zapato) {
        return res.status(404).json({ message: 'Zapato no encontrado' });
      }
      
      // Generar número de factura
      const numeroFactura = `F-${Date.now()}`;
      
      const query = `
        INSERT INTO facturacion (
          numero_factura, cliente_id, zapato_id, subtotal, descuento, total, 
          metodo_pago, monto_efectivo, monto_tarjeta, monto_transferencia, 
          observaciones, fecha_factura
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `;
      
      db.run(query, [
        numeroFactura, cliente_id, zapato_id, subtotal, descuento, total,
        metodo_pago, monto_efectivo, monto_tarjeta, monto_transferencia,
        observaciones || ''
      ], function(err) {
        if (err) {
          return res.status(500).json({ message: 'Error al crear factura', error: err.message });
        }
        
        res.status(201).json({
          message: 'Factura creada exitosamente',
          id: this.lastID,
          numero_factura: numeroFactura
        });
      });
    });
  });
});

// POST - Crear factura desde reserva
router.post('/desde-reserva/:reserva_id', (req, res) => {
  const { reserva_id } = req.params;
  const { descuento = 0, metodo_pago, monto_efectivo = 0, monto_tarjeta = 0, monto_transferencia = 0, observaciones } = req.body;
  
  // Obtener datos de la reserva
  const queryReserva = `
    SELECT r.*, z.precio, z.id as zapato_id, r.cliente_id
    FROM reservas r
    INNER JOIN zapato z ON r.zapato_id = z.id
    WHERE r.id = ? AND r.estado = 'pendiente'
  `;
  
  db.get(queryReserva, [reserva_id], (err, reserva) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener reserva', error: err.message });
    }
    
    if (!reserva) {
      return res.status(404).json({ message: 'Reserva no encontrada o ya procesada' });
    }
    
    const subtotal = reserva.precio;
    const total = subtotal - descuento;
    const numeroFactura = `F-${Date.now()}`;
    
    // Crear factura
    const queryFactura = `
      INSERT INTO facturacion (
        numero_factura, cliente_id, zapato_id, subtotal, descuento, total, 
        metodo_pago, monto_efectivo, monto_tarjeta, monto_transferencia, 
        observaciones, fecha_factura
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `;
    
    db.run(queryFactura, [
      numeroFactura, reserva.cliente_id, reserva.zapato_id, subtotal, descuento, total,
      metodo_pago, monto_efectivo, monto_tarjeta, monto_transferencia,
      observaciones || ''
    ], function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error al crear factura', error: err.message });
      }
      
      // Marcar reserva como completada
      db.run('UPDATE reservas SET estado = "completada" WHERE id = ?', [reserva_id], (err) => {
        if (err) {
          console.error('Error al actualizar reserva:', err);
        }
      });
      
      res.status(201).json({
        message: 'Factura creada desde reserva exitosamente',
        id: this.lastID,
        numero_factura: numeroFactura
      });
    });
  });
});

// PUT - Actualizar factura
router.put('/:id', validateFactura, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { id } = req.params;
  const { 
    cliente_id, 
    zapato_id, 
    subtotal, 
    descuento = 0, 
    total, 
    metodo_pago,
    monto_efectivo = 0,
    monto_tarjeta = 0,
    monto_transferencia = 0,
    observaciones 
  } = req.body;
  
  const query = `
    UPDATE facturacion SET
    cliente_id = ?, zapato_id = ?, subtotal = ?, descuento = ?, total = ?,
    metodo_pago = ?, monto_efectivo = ?, monto_tarjeta = ?, monto_transferencia = ?,
    observaciones = ?
    WHERE id = ?
  `;
  
  db.run(query, [
    cliente_id, zapato_id, subtotal, descuento, total,
    metodo_pago, monto_efectivo, monto_tarjeta, monto_transferencia,
    observaciones || '', id
  ], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error al actualizar factura', error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    
    res.json({ message: 'Factura actualizada exitosamente' });
  });
});

// DELETE - Eliminar factura
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM facturacion WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error al eliminar factura', error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    
    res.json({ message: 'Factura eliminada exitosamente' });
  });
});

// GET - Resumen de ventas del día
router.get('/resumen/dia', (req, res) => {
  const { fecha = new Date().toISOString().split('T')[0] } = req.query;
  
  const query = `
    SELECT 
      COUNT(*) as total_facturas,
      SUM(total) as total_vendido,
      SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END) as total_efectivo,
      SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total ELSE 0 END) as total_tarjeta,
      SUM(CASE WHEN metodo_pago = 'transferencia' THEN total ELSE 0 END) as total_transferencia,
      SUM(CASE WHEN metodo_pago = 'mixto' THEN total ELSE 0 END) as total_mixto,
      AVG(total) as promedio_venta
    FROM facturacion 
    WHERE DATE(fecha_factura) = ?
  `;
  
  db.get(query, [fecha], (err, resumen) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener resumen', error: err.message });
    }
    
    res.json({
      fecha,
      ...resumen,
      total_vendido: resumen.total_vendido || 0,
      total_facturas: resumen.total_facturas || 0,
      promedio_venta: resumen.promedio_venta || 0
    });
  });
});

// GET - Factura con formato de impresión
router.get('/:id/imprimir', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      f.*,
      c.nombre as cliente_nombre,
      c.apellido as cliente_apellido,
      c.cedula as cliente_cedula,
      c.telefono as cliente_telefono,
      c.direccion as cliente_direccion,
      z.marca,
      z.modelo,
      z.talla,
      z.precio,
      z.color,
      z.material
    FROM facturacion f
    INNER JOIN cliente c ON f.cliente_id = c.id
    INNER JOIN zapato z ON f.zapato_id = z.id
    WHERE f.id = ?
  `;
  
  db.get(query, [id], (err, factura) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener factura', error: err.message });
    }
    
    if (!factura) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    
    // Formato de factura para impresión
    const facturaImpresion = {
      empresa: {
        nombre: 'Variedades JM',
        direccion: 'Tu dirección aquí',
        telefono: 'Tu teléfono aquí',
        email: 'tu@email.com'
      },
      factura: {
        numero: factura.numero_factura,
        fecha: factura.fecha_factura,
        cliente: {
          nombre: `${factura.cliente_nombre} ${factura.cliente_apellido}`,
          cedula: factura.cliente_cedula,
          telefono: factura.cliente_telefono,
          direccion: factura.cliente_direccion
        },
        producto: {
          descripcion: `${factura.marca} ${factura.modelo} Talla ${factura.talla}`,
          color: factura.color,
          material: factura.material,
          precio: factura.precio
        },
        totales: {
          subtotal: factura.subtotal,
          descuento: factura.descuento,
          total: factura.total
        },
        pago: {
          metodo: factura.metodo_pago,
          efectivo: factura.monto_efectivo,
          tarjeta: factura.monto_tarjeta,
          transferencia: factura.monto_transferencia
        },
        observaciones: factura.observaciones
      }
    };
    
    res.json(facturaImpresion);
  });
});

module.exports = router;