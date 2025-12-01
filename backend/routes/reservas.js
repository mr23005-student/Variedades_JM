const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');

const db = new sqlite3.Database('./database.sqlite');

// Validaciones para reservas
const validateReserva = [
  body('cliente_id').isInt({ min: 1 }).withMessage('ID de cliente inválido'),
  body('zapato_id').isInt({ min: 1 }).withMessage('ID de zapato inválido'),
  body('fecha_reserva').isISO8601().withMessage('Fecha de reserva inválida'),
  body('fecha_vencimiento').isISO8601().withMessage('Fecha de vencimiento inválida'),
  body('abono').optional().isFloat({ min: 0 }).withMessage('El abono debe ser mayor a 0')
];

// GET - Obtener todas las reservas
router.get('/', (req, res) => {
  const { page = 1, limit = 10, estado, cliente_id } = req.query;
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT 
      r.*,
      c.nombre as cliente_nombre,
      c.apellido as cliente_apellido,
      c.cedula as cliente_cedula,
      c.telefono as cliente_telefono,
      z.marca,
      z.modelo,
      z.talla,
      z.precio,
      z.color,
      z.estado as zapato_estado
    FROM reservas r
    INNER JOIN cliente c ON r.cliente_id = c.id
    INNER JOIN zapato z ON r.zapato_id = z.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (estado) {
    query += ' AND r.estado = ?';
    params.push(estado);
  }
  
  if (cliente_id) {
    query += ' AND r.cliente_id = ?';
    params.push(cliente_id);
  }
  
  query += ' ORDER BY r.fecha_reserva DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);
  
  db.all(query, params, (err, reservas) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener reservas', error: err.message });
    }
    
    // Contar total para paginación
    let countQuery = 'SELECT COUNT(*) as total FROM reservas r WHERE 1=1';
    let countParams = [];
    
    if (estado) {
      countQuery += ' AND r.estado = ?';
      countParams.push(estado);
    }
    
    if (cliente_id) {
      countQuery += ' AND r.cliente_id = ?';
      countParams.push(cliente_id);
    }
    
    db.get(countQuery, countParams, (err, count) => {
      if (err) {
        return res.status(500).json({ message: 'Error al contar reservas', error: err.message });
      }
      
      res.json({
        reservas,
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

// GET - Obtener reserva por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      r.*,
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
    FROM reservas r
    INNER JOIN cliente c ON r.cliente_id = c.id
    INNER JOIN zapato z ON r.zapato_id = z.id
    WHERE r.id = ?
  `;
  
  db.get(query, [id], (err, reserva) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener reserva', error: err.message });
    }
    
    if (!reserva) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }
    
    res.json(reserva);
  });
});

// POST - Crear nueva reserva
router.post('/', validateReserva, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { cliente_id, zapato_id, fecha_reserva, fecha_vencimiento, abono, observaciones } = req.body;
  
  // Verificar que el cliente existe
  db.get('SELECT id FROM cliente WHERE id = ?', [cliente_id], (err, cliente) => {
    if (err) {
      return res.status(500).json({ message: 'Error al verificar cliente', error: err.message });
    }
    
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    // Verificar que el zapato existe y está disponible
    db.get('SELECT id, precio FROM zapato WHERE id = ?', [zapato_id], (err, zapato) => {
      if (err) {
        return res.status(500).json({ message: 'Error al verificar zapato', error: err.message });
      }
      
      if (!zapato) {
        return res.status(404).json({ message: 'Zapato no encontrado' });
      }
      
      // Verificar que el zapato no esté ya reservado
      db.get('SELECT id FROM reservas WHERE zapato_id = ? AND estado = "pendiente"', [zapato_id], (err, reservaExistente) => {
        if (err) {
          return res.status(500).json({ message: 'Error al verificar reserva existente', error: err.message });
        }
        
        if (reservaExistente) {
          return res.status(400).json({ message: 'El zapato ya está reservado' });
        }
        
        const query = `
          INSERT INTO reservas (cliente_id, zapato_id, fecha_reserva, fecha_vencimiento, abono, saldo_pendiente, estado, observaciones, fecha_creacion)
          VALUES (?, ?, ?, ?, ?, ?, 'pendiente', ?, datetime('now'))
        `;
        
        const abonoValue = abono || 0;
        const saldoPendiente = zapato.precio - abonoValue;
        
        db.run(query, [cliente_id, zapato_id, fecha_reserva, fecha_vencimiento, abonoValue, saldoPendiente, observaciones || ''], function(err) {
          if (err) {
            return res.status(500).json({ message: 'Error al crear reserva', error: err.message });
          }
          
          res.status(201).json({
            message: 'Reserva creada exitosamente',
            id: this.lastID
          });
        });
      });
    });
  });
});

// PUT - Actualizar reserva
router.put('/:id', validateReserva, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { id } = req.params;
  const { cliente_id, zapato_id, fecha_reserva, fecha_vencimiento, abono, observaciones } = req.body;
  
  // Obtener el precio del zapato para calcular el saldo
  db.get('SELECT precio FROM zapato WHERE id = ?', [zapato_id], (err, zapato) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener precio del zapato', error: err.message });
    }
    
    if (!zapato) {
      return res.status(404).json({ message: 'Zapato no encontrado' });
    }
    
    const abonoValue = abono || 0;
    const saldoPendiente = zapato.precio - abonoValue;
    
    const query = `
      UPDATE reservas SET
      cliente_id = ?, zapato_id = ?, fecha_reserva = ?, fecha_vencimiento = ?, 
      abono = ?, saldo_pendiente = ?, observaciones = ?
      WHERE id = ?
    `;
    
    db.run(query, [cliente_id, zapato_id, fecha_reserva, fecha_vencimiento, abonoValue, saldoPendiente, observaciones || '', id], function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error al actualizar reserva', error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Reserva no encontrada' });
      }
      
      res.json({ message: 'Reserva actualizada exitosamente' });
    });
  });
});

// PUT - Cambiar estado de reserva
router.put('/:id/estado', (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  
  if (!['pendiente', 'completada', 'cancelada', 'vencida'].includes(estado)) {
    return res.status(400).json({ message: 'Estado inválido' });
  }
  
  db.run('UPDATE reservas SET estado = ? WHERE id = ?', [estado, id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error al actualizar estado', error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }
    
    res.json({ message: 'Estado de reserva actualizado exitosamente' });
  });
});

// DELETE - Eliminar reserva
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM reservas WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error al eliminar reserva', error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }
    
    res.json({ message: 'Reserva eliminada exitosamente' });
  });
});

// GET - Reservas vencidas
router.get('/vencidas/list', (req, res) => {
  const query = `
    SELECT 
      r.*,
      c.nombre as cliente_nombre,
      c.apellido as cliente_apellido,
      c.cedula as cliente_cedula,
      c.telefono as cliente_telefono,
      z.marca,
      z.modelo,
      z.talla,
      z.precio,
      z.color
    FROM reservas r
    INNER JOIN cliente c ON r.cliente_id = c.id
    INNER JOIN zapato z ON r.zapato_id = z.id
    WHERE r.fecha_vencimiento < date('now') AND r.estado = 'pendiente'
    ORDER BY r.fecha_vencimiento ASC
  `;
  
  db.all(query, [], (err, reservasVencidas) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener reservas vencidas', error: err.message });
    }
    
    res.json(reservasVencidas);
  });
});

// PUT - Marcar reservas vencidas automáticamente
router.put('/vencidas/marcar', (req, res) => {
  const query = `
    UPDATE reservas 
    SET estado = 'vencida' 
    WHERE fecha_vencimiento < date('now') AND estado = 'pendiente'
  `;
  
  db.run(query, [], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error al marcar reservas vencidas', error: err.message });
    }
    
    res.json({ 
      message: 'Reservas vencidas marcadas exitosamente',
      reservasActualizadas: this.changes
    });
  });
});

module.exports = router;