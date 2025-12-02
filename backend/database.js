const sqlite3 = require('sqlite3').verbose();

// Crear y conectar a la base de datos SQLite
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
  } else {
    console.log('Conexión exitosa a la base de datos SQLite.');
  }
});

// Crear tablas para los zapatos
const createTables = () => {
  // Tabla zapato
  const zapatoQuery = `CREATE TABLE IF NOT EXISTS zapato (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    estado TEXT NOT NULL,
    fecha_registro DATE NOT NULL,
    fecha_venta DATE,
    codigo TEXT
  )`;

  db.run(zapatoQuery, (err) => {
    if (err) {
      console.error('Error al crear la tabla zapato:', err.message);
    } else {
      console.log('Tabla "zapato" creada exitosamente.');
      
      // Crear índice único para el campo código
      db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_zapato_codigo ON zapato(codigo)', (err) => {
        if (err) {
          console.error('Error al crear índice único para código:', err.message);
        } else {
          console.log('Índice único creado para el campo código.');
        }
      });
    }
  });

  // Tabla zapato_detalle
  const zapatoDetalleQuery = `CREATE TABLE IF NOT EXISTS zapato_detalle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_zapato INTEGER NOT NULL,
    talla TEXT NOT NULL,
    cm REAL NOT NULL,
    precio_compra REAL NOT NULL,
    precio_venta REAL NOT NULL,
    precio_vendido REAL,
    imagen TEXT,
    FOREIGN KEY (id_zapato) REFERENCES zapato(id)
  )`;

  db.run(zapatoDetalleQuery, (err) => {
    if (err) {
      console.error('Error al crear la tabla zapato_detalle:', err.message);
    } else {
      console.log('Tabla "zapato_detalle" creada exitosamente.');
    }
  });
};

// Crear tablas adicionales
const createAdditionalTables = () => {
  // Tabla cliente
  const clienteQuery = `CREATE TABLE IF NOT EXISTS cliente (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL
  )`;

  db.run(clienteQuery, (err) => {
    if (err) {
      console.error('Error al crear la tabla cliente:', err.message);
    } else {
      console.log('Tabla "cliente" creada exitosamente.');
    }
  });

  // Tabla usuario
  const usuarioQuery = `CREATE TABLE IF NOT EXISTS usuario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  )`;

  db.run(usuarioQuery, (err) => {
    if (err) {
      console.error('Error al crear la tabla usuario:', err.message);
    } else {
      console.log('Tabla "usuario" creada exitosamente.');
    }
  });

  // Tabla reservas
  const reservasQuery = `CREATE TABLE IF NOT EXISTS reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cliente INTEGER NOT NULL,
    id_zapato INTEGER NOT NULL,
    monto_pagado REAL NOT NULL,
    fecha_reserva DATE NOT NULL,
    fecha_limite DATE NOT NULL,
    FOREIGN KEY (id_cliente) REFERENCES cliente(id),
    FOREIGN KEY (id_zapato) REFERENCES zapato(id)
  )`;

  db.run(reservasQuery, (err) => {
    if (err) {
      console.error('Error al crear la tabla reservas:', err.message);
    } else {
      console.log('Tabla "reservas" creada exitosamente.');
    }
  });

  // Tabla facturación
  const facturacionQuery = `CREATE TABLE IF NOT EXISTS facturacion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cliente INTEGER NOT NULL,
    id_zapato INTEGER NOT NULL,
    total REAL NOT NULL,
    fecha DATE NOT NULL,
    FOREIGN KEY (id_cliente) REFERENCES cliente(id),
    FOREIGN KEY (id_zapato) REFERENCES zapato(id)
  )`;

  db.run(facturacionQuery, (err) => {
    if (err) {
      console.error('Error al crear la tabla facturación:', err.message);
    } else {
      console.log('Tabla "facturación" creada exitosamente.');
    }
  });

  // Tabla reportes
  const reportesQuery = `CREATE TABLE IF NOT EXISTS reportes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha DATE NOT NULL,
    ventas_totales INTEGER NOT NULL
  )`;

  db.run(reportesQuery, (err) => {
    if (err) {
      console.error('Error al crear la tabla reportes:', err.message);
    } else {
      console.log('Tabla "reportes" creada exitosamente.');
    }
  });
};

// Llamar a la función para crear las tablas
createTables();

// Llamar a la función para crear las tablas adicionales
createAdditionalTables();

// Probar la base de datos
const testDatabase = () => {
  const query = `INSERT INTO usuario (nombre, password) VALUES (?, ?)`;
  const values = ['usuario_prueba', '123456'];

  db.run(query, values, function (err) {
    if (err) {
      console.error('Error al insertar datos:', err.message);
    } else {
      console.log('Usuario insertado con ID:', this.lastID);
    }
  });
};

testDatabase();

module.exports = db;