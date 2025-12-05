const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');

// Registrar una nueva venta o reservación con tipos individuales por zapato
router.post('/', (req, res) => {
  console.log('=== DATOS RECIBIDOS EN BACKEND ===');
  console.log('req.body completo:', JSON.stringify(req.body, null, 2));
  
  const { cliente_id, zapatos_data } = req.body;
  
  console.log('cliente_id extraído:', cliente_id);
  console.log('zapatos_data extraído:', zapatos_data);
  console.log('zapatos_data es array:', Array.isArray(zapatos_data));
  console.log('zapatos_data length:', zapatos_data ? zapatos_data.length : 'undefined');

  if (!cliente_id || !zapatos_data || !Array.isArray(zapatos_data) || zapatos_data.length === 0) {
    console.log('ERROR: Datos incompletos');
    console.log('cliente_id válido:', !!cliente_id);
    console.log('zapatos_data válido:', !!zapatos_data);
    console.log('zapatos_data es array:', Array.isArray(zapatos_data));
    console.log('zapatos_data tiene elementos:', zapatos_data && zapatos_data.length > 0);
    
    return res.status(400).json({ 
      success: false, 
      message: 'Datos incompletos para la venta' 
    });
  }

  // Validar que cada zapato tenga precio_vendido y tipo
  for (let zapato of zapatos_data) {
    if (!zapato.zapato_id || !zapato.precio_vendido || !zapato.tipo) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cada zapato debe tener ID, precio vendido y tipo de operación' 
      });
    }
    
    if (!['venta', 'reservacion'].includes(zapato.tipo)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tipo de operación debe ser "venta" o "reservacion"' 
      });
    }
  }

  const db = new sqlite3.Database(dbPath);

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // Verificar que todos los zapatos estén disponibles
    const zapatos_ids = zapatos_data.map(z => z.zapato_id);
    const placeholders = zapatos_ids.map(() => '?').join(',');
    const checkQuery = `SELECT id, estado FROM zapato WHERE id IN (${placeholders}) AND estado = 'activo'`;
    
    db.all(checkQuery, zapatos_ids, (err, zapatos) => {
      if (err) {
        console.error('Error al verificar zapatos:', err);
        db.run("ROLLBACK");
        db.close();
        return res.status(500).json({ 
          success: false, 
          message: 'Error al verificar disponibilidad de zapatos' 
        });
      }

      if (zapatos.length !== zapatos_ids.length) {
        db.run("ROLLBACK");
        db.close();
        return res.status(400).json({ 
          success: false, 
          message: 'Algunos zapatos no están disponibles para venta' 
        });
      }

      // Calcular el total
      const total = zapatos_data.reduce((sum, zapato) => sum + parseFloat(zapato.precio_vendido), 0);

      // Determinar tipo de operación (mixta si hay diferentes tipos)
      const tipos = [...new Set(zapatos_data.map(z => z.tipo))];
      const tipoOperacion = tipos.length === 1 ? tipos[0] : 'mixta';

      // Insertar la venta principal
      const fechaActual = new Date().toISOString();
      const insertVentaQuery = `
        INSERT INTO ventas (cliente_id, tipo, fecha, total, estado)
        VALUES (?, ?, ?, ?, 'activa')
      `;

      db.run(insertVentaQuery, [cliente_id, tipoOperacion, fechaActual, total], function(err) {
        if (err) {
          console.error('Error al insertar venta:', err);
          db.run("ROLLBACK");
          db.close();
          return res.status(500).json({ 
            success: false, 
            message: 'Error al registrar la venta' 
          });
        }

        const ventaId = this.lastID;
        console.log(`💾 Venta creada con ID: ${ventaId}, procesando ${zapatos_data.length} zapatos`);

        // Procesar zapatos secuencialmente para evitar problemas de concurrencia
        const procesarZapato = (index) => {
          if (index >= zapatos_data.length) {
            // Todos los zapatos procesados exitosamente
            db.run("COMMIT", (err) => {
              if (err) {
                console.error('Error al confirmar transacción:', err);
                db.close();
                return res.status(500).json({ 
                  success: false, 
                  message: 'Error al confirmar la venta' 
                });
              }

              console.log(`✅ Operación completada exitosamente. ${zapatos_data.length} zapatos procesados.`);
              res.json({ 
                success: true, 
                message: `${tipoOperacion === 'venta' ? 'Venta' : tipoOperacion === 'reservacion' ? 'Reservación' : 'Operación mixta'} registrada exitosamente`,
                ventaId: ventaId,
                zapatosProcesados: zapatos_data.length
              });
              
              db.close();
            });
            return;
          }

          const zapato_data = zapatos_data[index];
          const { zapato_id, precio_vendido, tipo } = zapato_data;
          const nuevoEstado = tipo === 'venta' ? 'vendido' : 'reservado';

          console.log(`🔄 Procesando zapato ${index + 1}/${zapatos_data.length}: ID=${zapato_id}, tipo=${tipo}`);

          // 1. Insertar detalle de venta
          const insertDetalleQuery = `
            INSERT INTO detalle_ventas (venta_id, zapato_id, precio_venta, tipo)
            VALUES (?, ?, ?, ?)
          `;

          db.run(insertDetalleQuery, [ventaId, zapato_id, precio_vendido, tipo], function(err) {
            if (err) {
              console.error(`❌ Error al insertar detalle zapato ${index + 1}:`, err);
              db.run("ROLLBACK");
              db.close();
              return res.status(500).json({ 
                success: false, 
                message: `Error al registrar zapato ${index + 1}` 
              });
            }

            // 2. Actualizar precio vendido en zapato_detalle
            const updateZapatoQuery = `
              UPDATE zapato_detalle 
              SET precio_vendido = ? 
              WHERE id_zapato = ?
            `;

            db.run(updateZapatoQuery, [precio_vendido, zapato_id], (err) => {
              if (err) {
                console.error(`❌ Error al actualizar precio zapato ${index + 1}:`, err);
                db.run("ROLLBACK");
                db.close();
                return res.status(500).json({ 
                  success: false, 
                  message: `Error al actualizar precio del zapato ${index + 1}` 
                });
              }

              // 3. Actualizar estado del zapato
              const updateEstadoQuery = `
                UPDATE zapato 
                SET estado = ?, fecha_venta = ? 
                WHERE id = ?
              `;

              db.run(updateEstadoQuery, [nuevoEstado, fechaActual, zapato_id], (err) => {
                if (err) {
                  console.error(`❌ Error al actualizar estado zapato ${index + 1}:`, err);
                  db.run("ROLLBACK");
                  db.close();
                  return res.status(500).json({ 
                    success: false, 
                    message: `Error al actualizar estado del zapato ${index + 1}` 
                  });
                }

                console.log(`✅ Zapato ${index + 1} procesado exitosamente`);
                // Procesar siguiente zapato
                procesarZapato(index + 1);
              });
            });
          });
        };

        // Iniciar procesamiento secuencial
        procesarZapato(0);
      });
    });
  });
});

// Obtener todas las ventas
router.get('/', (req, res) => {
  const { tipo, fecha_inicio, fecha_fin, cliente_id } = req.query;
  
  const db = new sqlite3.Database(dbPath);
  
  let query = `
    SELECT v.*, c.nombre as cliente_nombre, c.telefono as cliente_telefono
    FROM ventas v
    LEFT JOIN cliente c ON v.cliente_id = c.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (tipo) {
    query += ' AND v.tipo = ?';
    params.push(tipo);
  }
  
  if (fecha_inicio) {
    query += ' AND date(v.fecha) >= date(?)';
    params.push(fecha_inicio);
  }
  
  if (fecha_fin) {
    query += ' AND date(v.fecha) <= date(?)';
    params.push(fecha_fin);
  }
  
  if (cliente_id) {
    query += ' AND v.cliente_id = ?';
    params.push(cliente_id);
  }
  
  query += ' ORDER BY v.fecha DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error al obtener ventas:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al obtener las ventas' 
      });
    }
    
    res.json({ 
      success: true, 
      ventas: rows 
    });
  });
  
  db.close();
});

// Obtener detalles de una venta específica
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const db = new sqlite3.Database(dbPath);
  
  const ventaQuery = `
    SELECT v.*, c.nombre as cliente_nombre, c.telefono as cliente_telefono
    FROM ventas v
    LEFT JOIN cliente c ON v.cliente_id = c.id
    WHERE v.id = ?
  `;
  
  const detallesQuery = `
    SELECT dv.*, z.marca, z.modelo, z.codigo, zd.talla, zd.precio_compra
    FROM detalle_ventas dv
    LEFT JOIN zapato z ON dv.zapato_id = z.id
    LEFT JOIN zapato_detalle zd ON z.id = zd.id_zapato
    WHERE dv.venta_id = ?
  `;
  
  db.get(ventaQuery, [id], (err, venta) => {
    if (err) {
      console.error('Error al obtener venta:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al obtener la venta' 
      });
    }
    
    if (!venta) {
      return res.status(404).json({ 
        success: false, 
        message: 'Venta no encontrada' 
      });
    }
    
    db.all(detallesQuery, [id], (err, detalles) => {
      if (err) {
        console.error('Error al obtener detalles de venta:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error al obtener los detalles de la venta' 
        });
      }
      
      res.json({ 
        success: true, 
        venta: {
          ...venta,
          detalles: detalles
        }
      });
    });
  });
  
  db.close();
});

// Buscar zapatos activos por código
router.get('/zapatos/buscar/:codigo', (req, res) => {
  const { codigo } = req.params;
  
  const db = new sqlite3.Database(dbPath);
  
  const query = `
    SELECT z.*, zd.talla, zd.precio_compra, zd.precio_venta
    FROM zapato z
    LEFT JOIN zapato_detalle zd ON z.id = zd.id_zapato
    WHERE z.codigo = ? AND z.estado = 'activo'
  `;
  
  db.get(query, [codigo], (err, zapato) => {
    if (err) {
      console.error('Error al buscar zapato:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al buscar zapato' 
      });
    }
    
    if (!zapato) {
      return res.json({ 
        success: false, 
        message: 'Zapato no encontrado o no disponible' 
      });
    }
    
    // Formatear los datos para el frontend
    const zapatoFormateado = {
      id: zapato.id,
      codigo: zapato.codigo,
      descripcion: `${zapato.marca} ${zapato.modelo}`,
      talla: zapato.talla || 'N/A',
      precio_venta: zapato.precio_venta || 0,
      marca: zapato.marca,
      modelo: zapato.modelo
    };
    
    res.json({ 
      success: true, 
      zapato: zapatoFormateado 
    });
  });
  
  db.close();
});

// Buscar cliente por término (nombre, teléfono o ID)
router.get('/clientes/buscar', (req, res) => {
  const { termino } = req.query;
  
  if (!termino || termino.trim().length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'El término de búsqueda es requerido' 
    });
  }
  
  const db = new sqlite3.Database(dbPath);
  const searchTerm = `%${termino.trim()}%`;
  
  const query = `
    SELECT id, nombre, telefono FROM cliente 
    WHERE nombre LIKE ? OR telefono LIKE ? OR id = ?
    LIMIT 1
  `;
  
  // Intentar convertir el término a número para búsqueda por ID
  const idBusqueda = isNaN(termino) ? -1 : parseInt(termino);
  
  db.get(query, [searchTerm, searchTerm, idBusqueda], (err, cliente) => {
    if (err) {
      console.error('Error al buscar cliente:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al buscar cliente' 
      });
    }
    
    if (cliente) {
      res.json({ 
        success: true, 
        cliente: cliente 
      });
    } else {
      res.json({ 
        success: false, 
        message: 'Cliente no encontrado' 
      });
    }
  });
  
  db.close();
});

// Actualizar estado de una venta (cancelar, completar reservación, etc.)
router.put('/:id/estado', (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  
  if (!estado || !['activa', 'cancelada', 'completada'].includes(estado)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Estado inválido' 
    });
  }
  
  const db = new sqlite3.Database(dbPath);
  
  const query = 'UPDATE ventas SET estado = ? WHERE id = ?';
  
  db.run(query, [estado, id], function(err) {
    if (err) {
      console.error('Error al actualizar estado de venta:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar el estado de la venta' 
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Venta no encontrada' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Estado actualizado exitosamente' 
    });
  });
  
  db.close();
});

module.exports = router;