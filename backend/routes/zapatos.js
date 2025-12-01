const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');

const db = new sqlite3.Database('./database.sqlite');

// Validaciones para zapatos
const validateZapato = [
  body('marca').notEmpty().withMessage('La marca es requerida'),
  body('modelo').notEmpty().withMessage('El modelo es requerido'),
  body('talla').isFloat({ min: 1 }).withMessage('La talla debe ser un número válido'),
  body('precio').isFloat({ min: 0 }).withMessage('El precio debe ser mayor a 0'),
  body('estado').isIn(['nuevo', 'seminuevo', 'usado']).withMessage('Estado inválido'),
  body('genero').isIn(['masculino', 'femenino', 'unisex']).withMessage('Género inválido'),
  body('color').notEmpty().withMessage('El color es requerido'),
  body('material').notEmpty().withMessage('El material es requerido')
];

// GET - Obtener todos los zapatos
router.get('/', (req, res) => {
  const { page = 1, limit = 10, marca, estado, genero, minPrecio, maxPrecio } = req.query;
  const offset = (page - 1) * limit;
  
  let query = 'SELECT * FROM zapato WHERE 1=1';
  const params = [];
  
  if (marca) {
    query += ' AND marca LIKE ?';
    params.push(`%${marca}%`);
  }
  
  if (estado) {
    query += ' AND estado = ?';
    params.push(estado);
  }
  
  if (genero) {
    query += ' AND genero = ?';
    params.push(genero);
  }
  
  if (minPrecio) {
    query += ' AND precio >= ?';
    params.push(minPrecio);
  }
  
  if (maxPrecio) {
    query += ' AND precio <= ?';
    params.push(maxPrecio);
  }
  
  query += ' ORDER BY fecha_ingreso DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);
  
  db.all(query, params, (err, zapatos) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener zapatos', error: err.message });
    }
    
    // Contar total para paginación
    const countQuery = 'SELECT COUNT(*) as total FROM zapato WHERE 1=1' + 
      (marca ? ' AND marca LIKE ?' : '') +
      (estado ? ' AND estado = ?' : '') +
      (genero ? ' AND genero = ?' : '') +
      (minPrecio ? ' AND precio >= ?' : '') +
      (maxPrecio ? ' AND precio <= ?' : '');
    
    const countParams = params.slice(0, -2);
    
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

// POST - Crear nuevo zapato
router.post('/', validateZapato, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { marca, modelo, talla, precio, estado, genero, color, material, descripcion } = req.body;
  
  const query = `
    INSERT INTO zapato (marca, modelo, talla, precio, estado, genero, color, material, descripcion, fecha_ingreso)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `;
  
  db.run(query, [marca, modelo, talla, precio, estado, genero, color, material, descripcion || ''], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error al crear zapato', error: err.message });
    }
    
    res.status(201).json({
      message: 'Zapato creado exitosamente',
      id: this.lastID
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

// GET - Buscar zapatos
router.get('/search/:term', (req, res) => {
  const { term } = req.params;
  const searchTerm = `%${term}%`;
  
  const query = `
    SELECT * FROM zapato 
    WHERE marca LIKE ? OR modelo LIKE ? OR color LIKE ? OR material LIKE ? OR descripcion LIKE ?
    ORDER BY fecha_ingreso DESC
  `;
  
  db.all(query, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm], (err, zapatos) => {
    if (err) {
      return res.status(500).json({ message: 'Error en la búsqueda', error: err.message });
    }
    
    res.json(zapatos);
  });
});

module.exports = router;