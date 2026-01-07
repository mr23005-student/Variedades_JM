const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');

const db = new sqlite3.Database('./database.sqlite');

// Validaciones para clientes (solo nombre y teléfono)
const validateCliente = [
  body('nombre')
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2 })
    .withMessage('El nombre debe tener al menos 2 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),
  body('telefono')
    .notEmpty()
    .withMessage('El teléfono es requerido')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('El formato del teléfono debe ser ####-####')
];

// GET - Obtener todos los clientes
router.get('/', (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const offset = (page - 1) * limit;
  
  let query = 'SELECT * FROM cliente WHERE 1=1';
  const params = [];
  
  if (search) {
    query += ' AND (nombre LIKE ? OR telefono LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
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
      countQuery += ' AND (nombre LIKE ? OR telefono LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams = [searchTerm, searchTerm];
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

// GET - Buscar cliente por teléfono
router.get('/telefono/:telefono', (req, res) => {
  const { telefono } = req.params;
  
  db.get('SELECT * FROM cliente WHERE telefono = ?', [telefono], (err, cliente) => {
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
  
  const { nombre, telefono } = req.body;
  
  // Verificar si ya existe un cliente con el mismo teléfono
  db.get('SELECT id FROM cliente WHERE telefono = ?', [telefono], (err, existingClient) => {
    if (err) {
      return res.status(500).json({ message: 'Error al verificar cliente', error: err.message });
    }
    
    if (existingClient) {
      return res.status(409).json({ message: 'Ya existe un cliente con este número de teléfono' });
    }
    
    const query = `
      INSERT INTO cliente (nombre, telefono)
      VALUES (?, ?)
    `;
    
    db.run(query, [nombre.trim(), telefono.trim()], function(err) {
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
  const { nombre, telefono } = req.body;
  
  // Verificar si ya existe otro cliente con el mismo teléfono
  db.get('SELECT id FROM cliente WHERE telefono = ? AND id != ?', [telefono, id], (err, existingClient) => {
    if (err) {
      return res.status(500).json({ message: 'Error al verificar cliente', error: err.message });
    }
    
    if (existingClient) {
      return res.status(409).json({ message: 'Ya existe otro cliente con este número de teléfono' });
    }
    
    const query = `
      UPDATE cliente SET nombre = ?, telefono = ?
      WHERE id = ?
    `;
    
    db.run(query, [nombre.trim(), telefono.trim(), id], function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error al actualizar cliente', error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Cliente no encontrado' });
      }
      
      res.json({ 
        message: 'Cliente actualizado exitosamente',
        cliente: {
          id: parseInt(id),
          nombre: nombre.trim(),
          telefono: telefono.trim()
        }
      });
    });
  });
});

// DELETE - Eliminar cliente
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // Eliminar cliente directamente (sin verificaciones de relaciones por ahora)
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

// GET - Historial de compras del cliente (placeholder por ahora)
router.get('/:id/historial', (req, res) => {
  const { id } = req.params;
  
  // Por ahora retornamos un array vacío hasta implementar ventas
  res.json({
    cliente_id: id,
    historial: [],
    message: 'Historial de compras estará disponible cuando se implemente el módulo de ventas'
  });
});

module.exports = router;