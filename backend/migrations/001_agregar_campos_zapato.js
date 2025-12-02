const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
  } else {
    console.log('Conexión exitosa para migración.');
  }
});

const runMigration = () => {
  console.log('Iniciando migración: Agregar campos código y precio_vendido...');
  
  // Agregar campo 'codigo' a la tabla zapato
  db.run('ALTER TABLE zapato ADD COLUMN codigo TEXT UNIQUE', (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error al agregar campo código:', err.message);
    } else {
      console.log('✅ Campo "codigo" agregado a la tabla zapato');
    }
    
    // Agregar campo 'precio_vendido' a la tabla zapato_detalle
    db.run('ALTER TABLE zapato_detalle ADD COLUMN precio_vendido REAL', (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error al agregar campo precio_vendido:', err.message);
      } else {
        console.log('✅ Campo "precio_vendido" agregado a la tabla zapato_detalle');
      }
      
      console.log('Migración completada exitosamente.');
      db.close();
    });
  });
};

// Ejecutar migración
runMigration();