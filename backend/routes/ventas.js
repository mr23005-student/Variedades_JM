const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');

// Registrar una nueva venta o reservación
router.post('/', (req, res) => {
  const { cliente_id, tipo, zapatos_data } = req.body;

  if (!cliente_id || !tipo || !zapatos_data || !Array.isArray(zapatos_data) || zapatos_data.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Datos incompletos para la venta' 
    });
  }

  // Validar que cada zapato tenga precio_vendido
  for (let zapato of zapatos_data) {
    if (!zapato.zapato_id || !zapato.precio_vendido) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cada zapato debe tener ID y precio vendido' 
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

      // Insertar la venta principal
      const fechaActual = new Date().toISOString();
      const insertVentaQuery = `
        INSERT INTO ventas (cliente_id, tipo, fecha, total, estado)
        VALUES (?, ?, ?, ?, 'activa')
      `;

      db.run(insertVentaQuery, [cliente_id, tipo, fechaActual, total], function(err) {
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
        const nuevoEstado = tipo === 'venta' ? 'vendido' : 'reservado';

        // Procesar cada zapato
        let zapatosProcessed = 0;
        let hasError = false;

        const processZapato = (zapatoData) => {
          const { zapato_id, precio_vendido } = zapatoData;

          // 1. Insertar detalle de venta
          const insertDetalleQuery = `
            INSERT INTO detalle_ventas (venta_id, zapato_id, precio_venta)
            VALUES (?, ?, ?)
          `;

          db.run(insertDetalleQuery, [ventaId, zapato_id, precio_vendido], function(err) {
            if (err) {
              if (!hasError) {
                hasError = true;
                console.error('Error al insertar detalle:', err);
                db.run("ROLLBACK");
                db.close();
                return res.status(500).json({ 
                  success: false, 
                  message: 'Error al registrar detalle de venta' 
                });
              }
              return;
            }

            // 2. Actualizar precio_vendido en zapato_detalle
            const updatePrecioQuery = `
              UPDATE zapato_detalle 
              SET precio_vendido = ? 
              WHERE id_zapato = ?
            `;

            db.run(updatePrecioQuery, [precio_vendido, zapato_id], function(err) {
              if (err) {
                if (!hasError) {
                  hasError = true;
                  console.error('Error al actualizar precio:', err);
                  db.run("ROLLBACK");
                  db.close();
                  return res.status(500).json({ 
                    success: false, 
                    message: 'Error al actualizar precio vendido' 
                  });
                }
                return;
              }

              // 3. Actualizar estado del zapato
              const updateEstadoQuery = `
                UPDATE zapato 
                SET estado = ?, fecha_venta = ? 
                WHERE id = ?
              `;

              db.run(updateEstadoQuery, [nuevoEstado, fechaActual, zapato_id], function(err) {
                if (err) {
                  if (!hasError) {
                    hasError = true;
                    console.error('Error al actualizar estado:', err);
                    db.run("ROLLBACK");
                    db.close();
                    return res.status(500).json({ 
                      success: false, 
                      message: 'Error al actualizar estado del zapato' 
                    });
                  }
                  return;
                }

                zapatosProcessed++;

                // Si todos los zapatos han sido procesados
                if (zapatosProcessed === zapatos_data.length && !hasError) {
                  db.run("COMMIT", (err) => {
                    db.close();
                    if (err) {
                      console.error('Error al confirmar transacción:', err);
                      return res.status(500).json({ 
                        success: false, 
                        message: 'Error al confirmar la venta' 
                      });
                    }

                    res.json({ 
                      success: true, 
                      message: `${tipo === 'venta' ? 'Venta' : 'Reservación'} registrada exitosamente`,
                      ventaId: ventaId,
                      total: total
                    });
                  });
                }
              });
            });
          });
        };

        // Procesar todos los zapatos
        zapatos_data.forEach(processZapato);
      });
    });
  });
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
    db.close();
    
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
});

// Buscar cliente por término
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
  
  const idBusqueda = isNaN(termino) ? -1 : parseInt(termino);
  
  db.get(query, [searchTerm, searchTerm, idBusqueda], (err, cliente) => {
    db.close();
    
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
    db.close();
    
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
});

module.exports = router;