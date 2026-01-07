const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
  } else {
    console.log('Conexión exitosa para migración.');
  }
});

const runMigration = () => {
  console.log('Iniciando migración: Agregar campos tipo y datos a la tabla reportes...');
  
  // Agregar campo 'tipo' a la tabla reportes
  db.run(
    `ALTER TABLE reportes ADD COLUMN tipo TEXT NOT NULL DEFAULT 'diario' CHECK (tipo IN ('diario', 'semanal', 'mensual'))`,
    (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error al agregar campo tipo:', err.message);
      } else {
        console.log('✅ Campo "tipo" agregado a la tabla reportes');
      }
      
      // Agregar campo 'datos' a la tabla reportes
      db.run(
        `ALTER TABLE reportes ADD COLUMN datos TEXT DEFAULT '{}'`,
        (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error('Error al agregar campo datos:', err.message);
          } else {
            console.log('✅ Campo "datos" agregado a la tabla reportes');
          }
          
          console.log('Migración completada exitosamente.');
          db.close();
        }
      );
    }
  );
};

// Ejecutar migración
runMigration();