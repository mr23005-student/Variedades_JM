const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');

const db = new sqlite3.Database('./database.sqlite');

// Validaciones para clientes
const validateCliente = [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('apellido').notEmpty().withMessage('El apellido es requerido'),
  body('cedula').isLength({ min: 8 }).withMessage('La cédula debe tener al menos 8 caracteres'),
  body('telefono').notEmpty().withMessage('El teléfono es requerido'),
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('direccion').notEmpty().withMessage('La dirección es requerida')
];

// GET - Obtener todos los clientes
router.get('/', (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const offset = (page - 1) * limit;
  
  let query = 'SELECT * FROM cliente WHERE 1=1';
  const params = [];
  
  if (search) {
    query += ' AND (nombre LIKE ? OR apellido LIKE ? OR cedula LIKE ? OR telefono LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }
  
  query += ' ORDER BY fecha_registro DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);
  
  db.all(query, params, (err, clientes) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener clientes', error: err.message });
    }
    
    // Contar total para paginación
    let countQuery = 'SELECT COUNT(*) as total FROM cliente WHERE 1=1';
    let countParams = [];
    
    if (search) {
      countQuery += ' AND (nombre LIKE ? OR apellido LIKE ? OR cedula LIKE ? OR telefono LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams = [searchTerm, searchTerm, searchTerm, searchTerm];
    }
    
    db.get(countQuery, countParams, (err, count) => {
      if (err) {
        return res.status(500).json({ message: 'Error al contar clientes', error: err.message });
      }
      
      res.json({
        clientes,
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

// GET - Obtener cliente por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM cliente WHERE id = ?', [id], (err, cliente) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener cliente', error: err.message });
    }
    
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    res.json(cliente);
  });
});

// GET - Buscar cliente por cédula
router.get('/cedula/:cedula', (req, res) => {
  const { cedula } = req.params;
  
  db.get('SELECT * FROM cliente WHERE cedula = ?', [cedula], (err, cliente) => {
    if (err) {
      return res.status(500).json({ message: 'Error al buscar cliente', error: err.message });
    }
    
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    res.json(cliente);
  });
});

// POST - Crear nuevo cliente
router.post('/', validateCliente, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { nombre, apellido, cedula, telefono, email, direccion } = req.body;
  
  // Verificar si ya existe un cliente con la misma cédula
  db.get('SELECT id FROM cliente WHERE cedula = ?', [cedula], (err, existingClient) => {
    if (err) {
      return res.status(500).json({ message: 'Error al verificar cliente', error: err.message });
    }
    
    if (existingClient) {
      return res.status(400).json({ message: 'Ya existe un cliente con esta cédula' });
    }
    
    const query = `
      INSERT INTO cliente (nombre, apellido, cedula, telefono, email, direccion, fecha_registro)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `;
    
    db.run(query, [nombre, apellido, cedula, telefono, email || null, direccion], function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error al crear cliente', error: err.message });
      }
      
      res.status(201).json({
        message: 'Cliente creado exitosamente',
        id: this.lastID
      });
    });
  });
});

// PUT - Actualizar cliente
router.put('/:id', validateCliente, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { id } = req.params;
  const { nombre, apellido, cedula, telefono, email, direccion } = req.body;
  
  // Verificar si ya existe otro cliente con la misma cédula
  db.get('SELECT id FROM cliente WHERE cedula = ? AND id != ?', [cedula, id], (err, existingClient) => {
    if (err) {
      return res.status(500).json({ message: 'Error al verificar cliente', error: err.message });
    }
    
    if (existingClient) {
      return res.status(400).json({ message: 'Ya existe otro cliente con esta cédula' });
    }
    
    const query = `
      UPDATE cliente SET
      nombre = ?, apellido = ?, cedula = ?, telefono = ?, email = ?, direccion = ?
      WHERE id = ?
    `;
    
    db.run(query, [nombre, apellido, cedula, telefono, email || null, direccion, id], function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error al actualizar cliente', error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Cliente no encontrado' });
      }
      
      res.json({ message: 'Cliente actualizado exitosamente' });
    });
  });
});

// DELETE - Eliminar cliente
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // Verificar si el cliente tiene reservas o facturas
  db.get('SELECT COUNT(*) as count FROM reservas WHERE cliente_id = ?', [id], (err, reservas) => {
    if (err) {
      return res.status(500).json({ message: 'Error al verificar reservas', error: err.message });
    }
    
    if (reservas.count > 0) {
      return res.status(400).json({ message: 'No se puede eliminar el cliente porque tiene reservas asociadas' });
    }
    
    db.get('SELECT COUNT(*) as count FROM facturacion WHERE cliente_id = ?', [id], (err, facturas) => {
      if (err) {
        return res.status(500).json({ message: 'Error al verificar facturas', error: err.message });
      }
      
      if (facturas.count > 0) {
        return res.status(400).json({ message: 'No se puede eliminar el cliente porque tiene facturas asociadas' });
      }
      
      db.run('DELETE FROM cliente WHERE id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({ message: 'Error al eliminar cliente', error: err.message });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        
        res.json({ message: 'Cliente eliminado exitosamente' });
      });
    });
  });
});

// GET - Historial de compras del cliente
router.get('/:id/historial', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      f.id as factura_id,
      f.fecha_factura,
      f.total,
      f.metodo_pago,
      z.marca,
      z.modelo,
      z.talla,
      z.precio,
      z.color
    FROM facturacion f
    INNER JOIN zapato z ON f.zapato_id = z.id
    WHERE f.cliente_id = ?
    ORDER BY f.fecha_factura DESC
  `;
  
  db.all(query, [id], (err, historial) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener historial', error: err.message });
    }
    
    res.json(historial);
  });
});

module.exports = router;