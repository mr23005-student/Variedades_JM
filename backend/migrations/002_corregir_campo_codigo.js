const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
  } else {
    console.log('Conexión exitosa para migración corregida.');
  }
});

const runMigration = () => {
  console.log('Iniciando migración corregida: Agregar campo código...');
  
  // Primero agregar el campo sin la restricción UNIQUE
  db.run('ALTER TABLE zapato ADD COLUMN codigo TEXT', (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error al agregar campo código:', err.message);
      db.close();
      return;
    } else {
      console.log('✅ Campo "codigo" agregado a la tabla zapato');
    }
    
    // Crear un índice único para el campo código (esto es equivalente a UNIQUE)
    db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_zapato_codigo ON zapato(codigo)', (err) => {
      if (err) {
        console.error('Error al crear índice único para código:', err.message);
      } else {
        console.log('✅ Índice único creado para el campo código');
      }
      
      console.log('Migración corregida completada exitosamente.');
      db.close();
    });
  });
};

// Ejecutar migración
runMigration();