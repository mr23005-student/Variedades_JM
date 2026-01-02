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
  body('precio_vendido').optional().isFloat({ min: 0 }).withMessage('El precio vendido debe ser mayor a 0')
];

// GET - Obtener todas las reservas
router.get('/', (req, res) => {
  const { page = 1, limit = 10, orden = 'asc' } = req.query;
  const offset = (page - 1) * limit;

  console.log('Parámetros recibidos:', { page, limit, orden });

  let query = `
    SELECT 
      r.id,
      c.nombre AS cliente,
      c.telefono AS telefono,
      z.marca,
      zd.talla,
      zd.precio_venta,
      r.fecha_reserva,
      r.fecha_limite,
      r.estado
    FROM reservas r
    INNER JOIN cliente c ON r.id_cliente = c.id
    INNER JOIN zapato z ON r.id_zapato = z.id
    INNER JOIN zapato_detalle zd ON z.id = zd.id_zapato
    WHERE 1=1
  `;

  const params = [];

  // Ordenar por fecha de reserva
  const orderBy = orden === 'desc' ? 'DESC' : 'ASC';
  query += ` ORDER BY r.fecha_reserva ${orderBy} LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  console.log('Consulta SQL generada:', query);
  console.log('Parámetros de consulta:', params);

  db.all(query, params, (err, reservas) => {
    if (err) {
      console.error('Error en la consulta de reservas:', err.message);
      return res.status(500).json({ message: 'Error al obtener reservas', error: err.message });
    }

    console.log('Reservas obtenidas:', reservas);

    // Contar total para paginación
    let countQuery = 'SELECT COUNT(*) as total FROM reservas r WHERE 1=1';

    db.get(countQuery, [], (err, count) => {
      if (err) {
        console.error('Error al contar reservas:', err.message);
        return res.status(500).json({ message: 'Error al contar reservas', error: err.message });
      }

      console.log('Total de reservas:', count.total);

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

  console.log('ID recibido:', id);

  const query = `
    SELECT 
      r.id,
      r.id_cliente,
      r.id_zapato,
      c.nombre AS cliente,
      c.telefono AS telefono,
      z.marca,
      zd.talla,
      zd.precio_venta,
      r.monto_pagado,
      r.fecha_reserva,
      r.fecha_limite,
      r.estado,
      (zd.precio_venta - r.monto_pagado) AS restante
    FROM reservas r
    INNER JOIN cliente c ON r.id_cliente = c.id
    INNER JOIN zapato z ON r.id_zapato = z.id
    INNER JOIN zapato_detalle zd ON z.id = zd.id_zapato
    WHERE r.id = ?
  `;

  console.log('Consulta SQL generada:', query);

  db.get(query, [id], (err, reserva) => {
    if (err) {
      console.error('Error en la consulta de reserva por ID:', err.message);
      return res.status(500).json({ message: 'Error al obtener reserva', error: err.message });
    }

    if (!reserva) {
      console.log('Reserva no encontrada para ID:', id);
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    console.log('Reserva obtenida:', reserva);

    res.json(reserva);
  });
});

// POST - Crear nueva reserva
router.post('/', validateReserva, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { cliente_id, zapato_id, fecha_reserva, fecha_vencimiento, precio_vendido, observaciones } = req.body;

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

      // Verificar que el zapato no esté ya reservado
      db.get('SELECT id FROM reservas WHERE zapato_id = ? AND estado = "pendiente"', [zapato_id], (err, reservaExistente) => {
        if (err) {
          return res.status(500).json({ message: 'Error al verificar reserva existente', error: err.message });
        }

        if (reservaExistente) {
          return res.status(400).json({ message: 'El zapato ya está reservado' });
        }

        const query = `
          INSERT INTO reservas (cliente_id, zapato_id, fecha_reserva, fecha_vencimiento, precio_vendido, estado, observaciones, fecha_creacion)
          VALUES (?, ?, ?, ?, ?, 'pendiente', ?, datetime('now'))
        `;

        db.run(query, [cliente_id, zapato_id, fecha_reserva, fecha_vencimiento, precio_vendido || 0, observaciones || ''], function(err) {
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
  const { cliente_id, zapato_id, fecha_reserva, fecha_vencimiento, precio_vendido, observaciones } = req.body;

  const query = `
    UPDATE reservas SET
    cliente_id = ?, zapato_id = ?, fecha_reserva = ?, fecha_vencimiento = ?, 
    precio_vendido = ?, observaciones = ?
    WHERE id = ?
  `;

  db.run(query, [cliente_id, zapato_id, fecha_reserva, fecha_vencimiento, precio_vendido || 0, observaciones || '', id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error al actualizar reserva', error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    res.json({ message: 'Reserva actualizada exitosamente' });
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

// PUT - Actualizar pago y fecha límite de reserva
router.put('/:id/pago', (req, res) => {
  const { id } = req.params;
  const { monto_adicional, fecha_limite } = req.body;

  console.log('Actualizando pago para reserva:', id, { monto_adicional, fecha_limite });

  // Primero obtenemos los datos completos de la reserva
  const getReservaQuery = `
    SELECT 
      r.id, r.monto_pagado, r.id_zapato, r.id_cliente,
      zd.precio_venta
    FROM reservas r
    INNER JOIN zapato z ON r.id_zapato = z.id
    INNER JOIN zapato_detalle zd ON z.id = zd.id_zapato
    WHERE r.id = ?
  `;

  db.get(getReservaQuery, [id], (err, reserva) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener reserva', error: err.message });
    }

    if (!reserva) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    const nuevoMonto = reserva.monto_pagado + (monto_adicional || 0);
    const restante = reserva.precio_venta - nuevoMonto;
    const pagoCompleto = restante <= 0;
    
    console.log('=== ANÁLISIS DE PAGO COMPLETO ===');
    console.log('Reserva ID:', id);
    console.log('Monto actual:', reserva.monto_pagado);
    console.log('Monto adicional:', monto_adicional);
    console.log('Nuevo monto:', nuevoMonto);
    console.log('Precio venta:', reserva.precio_venta);
    console.log('Restante calculado:', restante);
    console.log('¿Pago completo?:', pagoCompleto);
    console.log('=====================================');

    // Iniciar transacción
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error al iniciar transacción', error: err.message });
      }

      // 1. Actualizar el monto pagado y fecha límite en reserva
      let updateReservaQuery = 'UPDATE reservas SET monto_pagado = ?';
      let params = [nuevoMonto];

      if (fecha_limite) {
        updateReservaQuery += ', fecha_limite = ?';
        params.push(fecha_limite);
      }

      // Si el pago está completo, cambiar estado a completada
      if (pagoCompleto) {
        updateReservaQuery += ', estado = ?';
        params.push('completada');
      }

      updateReservaQuery += ' WHERE id = ?';
      params.push(id);

      db.run(updateReservaQuery, params, function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ message: 'Error al actualizar reserva', error: err.message });
        }

        // Si el pago está completo, procesar como venta
        if (pagoCompleto) {
          console.log('🎯 INICIANDO PROCESO DE VENTA COMPLETA...');
          
          // 2. Cambiar estado del zapato a vendido
          const updateZapatoQuery = `
            UPDATE zapato_detalle 
            SET precio_vendido = ?, estado = 'vendido'
            WHERE id_zapato = ?
          `;

          console.log('📝 Ejecutando actualización de zapato...', {zapato_id: reserva.id_zapato, precio_vendido_final: nuevoMonto});

          db.run(updateZapatoQuery, [nuevoMonto, reserva.id_zapato], (err) => {
            if (err) {
              console.error('❌ Error al actualizar zapato:', err);
              db.run('ROLLBACK');
              return res.status(500).json({ message: 'Error al actualizar zapato', error: err.message });
            }

            console.log('✅ Zapato actualizado correctamente');

            // 3. Crear registro de venta
            const fechaActual = new Date().toISOString().split('T')[0];
            const insertVentaQuery = `
              INSERT INTO ventas (cliente_id, fecha, total, estado, tipo)
              VALUES (?, ?, ?, 'completada', 'venta')
            `;

            console.log('📝 Creando registro de venta...', {cliente_id: reserva.id_cliente, fecha: fechaActual, total_final: nuevoMonto});

            db.run(insertVentaQuery, [reserva.id_cliente, fechaActual, nuevoMonto], function(err) {
              if (err) {
                console.error('❌ Error al crear venta:', err);
                db.run('ROLLBACK');
                return res.status(500).json({ message: 'Error al crear venta', error: err.message });
              }

              const ventaId = this.lastID;
              console.log('✅ Venta creada con ID:', ventaId);

              // 4. Crear detalle de venta
              const insertDetalleQuery = `
                INSERT INTO detalle_ventas (venta_id, zapato_id, precio_venta, tipo)
                VALUES (?, ?, ?, 'venta')
              `;

              console.log('📝 Creando detalle de venta...', {venta_id: ventaId, zapato_id: reserva.id_zapato, precio_vendido_final: nuevoMonto});

              db.run(insertDetalleQuery, [ventaId, reserva.id_zapato, nuevoMonto], (err) => {
                if (err) {
                  console.error('❌ Error al crear detalle de venta:', err);
                  db.run('ROLLBACK');
                  return res.status(500).json({ message: 'Error al crear detalle de venta', error: err.message });
                }

                console.log('✅ Detalle de venta creado');

                // 5. Eliminar la reserva ya que se completó como venta
                const deleteReservaQuery = 'DELETE FROM reservas WHERE id = ?';
                
                console.log('📝 Eliminando reserva con ID:', id);

                db.run(deleteReservaQuery, [id], (err) => {
                  if (err) {
                    console.error('❌ Error al eliminar reserva:', err);
                    db.run('ROLLBACK');
                    return res.status(500).json({ message: 'Error al eliminar reserva completada', error: err.message });
                  }

                  console.log('✅ Reserva eliminada correctamente');

                  // Confirmar transacción
                  db.run('COMMIT', (err) => {
                    if (err) {
                      console.error('❌ Error al confirmar transacción:', err);
                      db.run('ROLLBACK');
                      return res.status(500).json({ message: 'Error al confirmar transacción', error: err.message });
                    }

                    console.log('🎉 PROCESO COMPLETO: Reserva convertida a venta exitosamente');

                    res.json({ 
                      message: 'Reserva completada como venta y eliminada exitosamente',
                      nuevo_monto: nuevoMonto,
                      pago_completo: true,
                      venta_id: ventaId,
                      reserva_eliminada: true
                    });
                  });
                });
              });
            });
          });
        } else {
          // Solo actualización de pago parcial
          console.log('💰 PAGO PARCIAL: Solo actualizando monto');
          
          db.run('COMMIT', (err) => {
            if (err) {
              console.error('❌ Error al confirmar pago parcial:', err);
              db.run('ROLLBACK');
              return res.status(500).json({ message: 'Error al confirmar transacción', error: err.message });
            }

            console.log('✅ Pago parcial actualizado correctamente');

            res.json({ 
              message: 'Pago actualizado exitosamente',
              nuevo_monto: nuevoMonto,
              pago_completo: false
            });
          });
        }
      });
    });
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
      r.id,
      c.nombre AS cliente,
      c.telefono AS telefono,
      z.marca,
      zd.talla,
      zd.precio_venta,
      r.fecha_reserva,
      r.fecha_limite,
      r.estado
    FROM reservas r
    INNER JOIN cliente c ON r.id_cliente = c.id
    INNER JOIN zapato z ON r.id_zapato = z.id
    INNER JOIN zapato_detalle zd ON z.id = zd.id_zapato
    WHERE r.fecha_limite < date('now') AND r.estado = 'pendiente'
    ORDER BY r.fecha_limite ASC
  `;

  console.log('Consulta SQL generada para reservas vencidas:', query);

  db.all(query, [], (err, reservasVencidas) => {
    if (err) {
      console.error('Error en la consulta de reservas vencidas:', err.message);
      return res.status(500).json({ message: 'Error al obtener reservas vencidas', error: err.message });
    }

    console.log('Reservas vencidas obtenidas:', reservasVencidas);

    res.json(reservasVencidas);
  });
});

// GET - Reservas por cliente
router.get('/cliente/:cliente_id', (req, res) => {
  const { cliente_id } = req.params;
  const { page = 1, limit = 10, orden = 'asc' } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      r.id,
      c.nombre AS cliente,
      c.telefono AS telefono,
      z.marca,
      zd.talla,
      zd.precio_venta,
      r.fecha_reserva,
      r.fecha_limite,
      r.estado
    FROM reservas r
    INNER JOIN cliente c ON r.id_cliente = c.id
    INNER JOIN zapato z ON r.id_zapato = z.id
    INNER JOIN zapato_detalle zd ON z.id = zd.id_zapato
    WHERE r.id_cliente = ?
  `;

  const params = [cliente_id];

  // Ordenar por fecha de reserva
  const orderBy = orden === 'desc' ? 'DESC' : 'ASC';
  query += ` ORDER BY r.fecha_reserva ${orderBy} LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  db.all(query, params, (err, reservas) => {
    if (err) {
      console.error('Error en la consulta de reservas por cliente:', err.message);
      return res.status(500).json({ message: 'Error al obtener reservas por cliente', error: err.message });
    }

    console.log('Reservas obtenidas:', reservas);

    // Contar total para paginación
    let countQuery = 'SELECT COUNT(*) as total FROM reservas r WHERE r.id_cliente = ?';

    db.get(countQuery, [cliente_id], (err, count) => {
      if (err) {
        console.error('Error al contar reservas por cliente:', err.message);
        return res.status(500).json({ message: 'Error al contar reservas por cliente', error: err.message });
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

module.exports = router;