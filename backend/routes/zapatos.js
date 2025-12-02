const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');

const db = new sqlite3.Database('./database.sqlite');

// Validaciones para zapatos con detalle
const validateZapato = [
  body('marca').notEmpty().withMessage('La marca es requerida'),
  body('modelo').notEmpty().withMessage('El modelo es requerido'),
  body('codigo').optional().isLength({ min: 1 }).withMessage('El código debe tener al menos 1 carácter'),
  body('estado').isIn(['activo', 'reservado', 'vendido']).withMessage('Estado debe ser: activo, reservado o vendido'),
  body('talla').notEmpty().withMessage('La talla es requerida'),
  body('cm').isFloat({ min: 0 }).withMessage('Los centímetros deben ser un número válido'),
  body('precio_compra').isFloat({ min: 0 }).withMessage('El precio de compra debe ser mayor a 0'),
  body('precio_venta').isFloat({ min: 0 }).withMessage('El precio de venta debe ser mayor a 0'),
  body('precio_vendido').optional().isFloat({ min: 0 }).withMessage('El precio vendido debe ser mayor a 0')
];

// GET - Obtener zapatos por estado específico
router.get('/estado/:estado', (req, res) => {
  const { estado } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  
  if (!['activo', 'reservado', 'vendido'].includes(estado)) {
    return res.status(400).json({ message: 'Estado inválido. Debe ser: activo, reservado o vendido' });
  }
  
  const query = `
    SELECT z.*, zd.talla, zd.cm, zd.precio_compra, zd.precio_venta, zd.precio_vendido, zd.imagen
    FROM zapato z
    LEFT JOIN zapato_detalle zd ON z.id = zd.id_zapato
    WHERE z.estado = ?
    ORDER BY z.fecha_registro DESC
    LIMIT ? OFFSET ?
  `;
  
  db.all(query, [estado, parseInt(limit), offset], (err, zapatos) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener zapatos', error: err.message });
    }
    
    // Contar total para paginación
    const countQuery = 'SELECT COUNT(*) as total FROM zapato WHERE estado = ?';
    
    db.get(countQuery, [estado], (err, count) => {
      if (err) {
        return res.status(500).json({ message: 'Error al contar zapatos', error: err.message });
      }
      
      res.json({
        zapatos,
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

// GET - Obtener todos los zapatos con sus detalles
router.get('/', (req, res) => {
  const { page = 1, limit = 10, search, marca, estado, minPrecio, maxPrecio } = req.query;
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT z.*, zd.talla, zd.cm, zd.precio_compra, zd.precio_venta, zd.precio_vendido, zd.imagen 
    FROM zapato z 
    LEFT JOIN zapato_detalle zd ON z.id = zd.id_zapato 
    WHERE 1=1
  `;
  const params = [];
  
  // Búsqueda general por marca, modelo o código
  if (search) {
    query += ' AND (z.marca LIKE ? OR z.modelo LIKE ? OR z.codigo LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  if (marca) {
    query += ' AND z.marca LIKE ?';
    params.push(`%${marca}%`);
  }
  
  if (estado) {
    query += ' AND z.estado = ?';
    params.push(estado);
  }
  
  if (minPrecio) {
    query += ' AND zd.precio_venta >= ?';
    params.push(minPrecio);
  }
  
  if (maxPrecio) {
    query += ' AND zd.precio_venta <= ?';
    params.push(maxPrecio);
  }
  
  query += ' ORDER BY z.fecha_registro DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);
  
  db.all(query, params, (err, zapatos) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener zapatos', error: err.message });
    }
    
    // Contar total para paginación
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM zapato z 
      LEFT JOIN zapato_detalle zd ON z.id = zd.id_zapato 
      WHERE 1=1
    `;
    let countParams = [];
    
    // Mismos filtros que la query principal pero sin LIMIT/OFFSET
    if (search) {
      countQuery += ' AND (z.marca LIKE ? OR z.modelo LIKE ? OR z.codigo LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (marca) {
      countQuery += ' AND z.marca LIKE ?';
      countParams.push(`%${marca}%`);
    }
    
    if (estado) {
      countQuery += ' AND z.estado = ?';
      countParams.push(estado);
    }
    
    if (minPrecio) {
      countQuery += ' AND zd.precio_venta >= ?';
      countParams.push(minPrecio);
    }
    
    if (maxPrecio) {
      countQuery += ' AND zd.precio_venta <= ?';
      countParams.push(maxPrecio);
    }
    
    db.get(countQuery, countParams, (err, count) => {
      if (err) {
        return res.status(500).json({ message: 'Error al contar zapatos', error: err.message });
      }
      
      res.json({
        zapatos,
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

// GET - Obtener zapato por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM zapato WHERE id = ?', [id], (err, zapato) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener zapato', error: err.message });
    }
    
    if (!zapato) {
      return res.status(404).json({ message: 'Zapato no encontrado' });
    }
    
    res.json(zapato);
  });
});

// POST - Crear nuevo zapato con detalle
router.post('/', (req, res) => {
  const { marca, modelo, codigo, estado, talla, cm, precio_compra, precio_venta, precio_vendido, imagen } = req.body;
  
  // Validaciones básicas para zapato
  if (!marca || !modelo || !estado) {
    return res.status(400).json({ 
      message: 'Marca, modelo y estado son requeridos' 
    });
  }
  
  // Validaciones básicas para detalle
  if (!talla || !cm || !precio_compra || !precio_venta) {
    return res.status(400).json({ 
      message: 'Talla, cm, precio_compra y precio_venta son requeridos' 
    });
  }
  
  // Validar estado
  if (!['activo', 'reservado', 'vendido'].includes(estado)) {
    return res.status(400).json({ 
      message: 'Estado debe ser: activo, reservado o vendido' 
    });
  }
  
  // Primero insertar en tabla zapato
  const zapatoQuery = `
    INSERT INTO zapato (marca, modelo, codigo, estado, fecha_registro)
    VALUES (?, ?, ?, ?, datetime('now'))
  `;
  
  db.run(zapatoQuery, [marca, modelo, codigo || null, estado], function(err) {
    if (err) {
      return res.status(500).json({ 
        message: 'Error al crear zapato', 
        error: err.message 
      });
    }
    
    const zapatoId = this.lastID;
    
    // Luego insertar en tabla zapato_detalle
    const detalleQuery = `
      INSERT INTO zapato_detalle (id_zapato, talla, cm, precio_compra, precio_venta, precio_vendido, imagen)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(detalleQuery, [zapatoId, talla, cm, precio_compra, precio_venta, precio_vendido || null, imagen || ''], function(err) {
      if (err) {
        return res.status(500).json({ 
          message: 'Error al crear detalle del zapato', 
          error: err.message 
        });
      }
      
      res.status(201).json({
        message: 'Zapato creado exitosamente',
        zapato: {
          id: zapatoId,
          marca,
          modelo,
          codigo,
          estado,
          fecha_registro: new Date().toISOString(),
          detalle: {
            id: this.lastID,
            talla,
            cm,
            precio_compra,
            precio_venta,
            precio_vendido,
            imagen
          }
        }
      });
    });
  });
});

// PUT - Actualizar zapato
router.put('/:id', validateZapato, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { id } = req.params;
  const { marca, modelo, talla, precio, estado, genero, color, material, descripcion } = req.body;
  
  const query = `
    UPDATE zapato SET
    marca = ?, modelo = ?, talla = ?, precio = ?, estado = ?,
    genero = ?, color = ?, material = ?, descripcion = ?
    WHERE id = ?
  `;
  
  db.run(query, [marca, modelo, talla, precio, estado, genero, color, material, descripcion || '', id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error al actualizar zapato', error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Zapato no encontrado' });
    }
    
    res.json({ message: 'Zapato actualizado exitosamente' });
  });
});

// DELETE - Eliminar zapato
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM zapato WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error al eliminar zapato', error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Zapato no encontrado' });
    }
    
    res.json({ message: 'Zapato eliminado exitosamente' });
  });
});

// GET - Buscar zapatos por código específico
router.get('/codigo/:codigo', (req, res) => {
  const { codigo } = req.params;
  
  const query = `
    SELECT z.*, zd.talla, zd.cm, zd.precio_compra, zd.precio_venta, zd.precio_vendido, zd.imagen
    FROM zapato z
    LEFT JOIN zapato_detalle zd ON z.id = zd.id_zapato
    WHERE z.codigo = ?
  `;
  
  db.get(query, [codigo], (err, zapato) => {
    if (err) {
      return res.status(500).json({ message: 'Error al buscar zapato por código', error: err.message });
    }
    
    if (!zapato) {
      return res.status(404).json({ message: 'Zapato no encontrado con ese código' });
    }
    
    res.json(zapato);
  });
});

// GET - Buscar zapatos
router.get('/search/:term', (req, res) => {
  const { term } = req.params;
  const searchTerm = `%${term}%`;
  
  const query = `
    SELECT z.*, zd.talla, zd.cm, zd.precio_compra, zd.precio_venta, zd.precio_vendido, zd.imagen
    FROM zapato z
    LEFT JOIN zapato_detalle zd ON z.id = zd.id_zapato
    WHERE z.marca LIKE ? OR z.modelo LIKE ? OR z.codigo LIKE ?
    ORDER BY z.fecha_registro DESC
  `;
  
  db.all(query, [searchTerm, searchTerm, searchTerm], (err, zapatos) => {
    if (err) {
      return res.status(500).json({ message: 'Error en la búsqueda', error: err.message });
    }
    
    res.json(zapatos);
  });
});

// PUT - Actualizar precio vendido
router.put('/:id/precio-vendido', (req, res) => {
  const { id } = req.params;
  const { precio_vendido } = req.body;
  
  if (!precio_vendido || precio_vendido <= 0) {
    return res.status(400).json({ message: 'El precio vendido debe ser mayor a 0' });
  }
  
  const query = `
    UPDATE zapato_detalle 
    SET precio_vendido = ?
    WHERE id_zapato = ?
  `;
  
  db.run(query, [precio_vendido, id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error al actualizar precio vendido', error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Zapato no encontrado' });
    }
    
    res.json({ 
      message: 'Precio vendido actualizado exitosamente',
      precio_vendido: precio_vendido
    });
  });
});

// PUT - Reservar zapato
router.put('/:id/reservar', (req, res) => {
  const { id } = req.params;
  
  // Verificar que el zapato está activo
  db.get('SELECT estado FROM zapato WHERE id = ?', [id], (err, zapato) => {
    if (err) {
      return res.status(500).json({ message: 'Error al verificar zapato', error: err.message });
    }
    
    if (!zapato) {
      return res.status(404).json({ message: 'Zapato no encontrado' });
    }
    
    if (zapato.estado !== 'activo') {
      return res.status(400).json({ message: 'El zapato no está disponible para reservar' });
    }
    
    // Actualizar estado a reservado
    const query = 'UPDATE zapato SET estado = ? WHERE id = ?';
    
    db.run(query, ['reservado', id], function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error al reservar zapato', error: err.message });
      }
      
      res.json({ 
        message: 'Zapato reservado exitosamente',
        estado: 'reservado'
      });
    });
  });
});

// PUT - Marcar zapato como vendido
router.put('/:id/vender', (req, res) => {
  const { id } = req.params;
  const { precio_vendido } = req.body;
  
  if (!precio_vendido || precio_vendido <= 0) {
    return res.status(400).json({ message: 'El precio vendido es requerido' });
  }
  
  // Verificar que el zapato está activo o reservado
  db.get('SELECT estado FROM zapato WHERE id = ?', [id], (err, zapato) => {
    if (err) {
      return res.status(500).json({ message: 'Error al verificar zapato', error: err.message });
    }
    
    if (!zapato) {
      return res.status(404).json({ message: 'Zapato no encontrado' });
    }
    
    if (!['activo', 'reservado'].includes(zapato.estado)) {
      return res.status(400).json({ message: 'El zapato no está disponible para vender' });
    }
    
    // Actualizar estado a vendido y fecha de venta
    const updateZapatoQuery = 'UPDATE zapato SET estado = ?, fecha_venta = datetime("now") WHERE id = ?';
    
    db.run(updateZapatoQuery, ['vendido', id], function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error al marcar zapato como vendido', error: err.message });
      }
      
      // Actualizar precio vendido en el detalle
      const updateDetalleQuery = 'UPDATE zapato_detalle SET precio_vendido = ? WHERE id_zapato = ?';
      
      db.run(updateDetalleQuery, [precio_vendido, id], function(err) {
        if (err) {
          return res.status(500).json({ message: 'Error al actualizar precio vendido', error: err.message });
        }
        
        res.json({ 
          message: 'Zapato vendido exitosamente',
          estado: 'vendido',
          precio_vendido: precio_vendido,
          fecha_venta: new Date().toISOString()
        });
      });
    });
  });
});

// PUT - Cancelar reserva (volver a activo)
router.put('/:id/cancelar-reserva', (req, res) => {
  const { id } = req.params;
  
  // Verificar que el zapato está reservado
  db.get('SELECT estado FROM zapato WHERE id = ?', [id], (err, zapato) => {
    if (err) {
      return res.status(500).json({ message: 'Error al verificar zapato', error: err.message });
    }
    
    if (!zapato) {
      return res.status(404).json({ message: 'Zapato no encontrado' });
    }
    
    if (zapato.estado !== 'reservado') {
      return res.status(400).json({ message: 'El zapato no está reservado' });
    }
    
    // Volver a estado activo
    const query = 'UPDATE zapato SET estado = ? WHERE id = ?';
    
    db.run(query, ['activo', id], function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error al cancelar reserva', error: err.message });
      }
      
      res.json({ 
        message: 'Reserva cancelada exitosamente',
        estado: 'activo'
      });
    });
  });
});

module.exports = router;