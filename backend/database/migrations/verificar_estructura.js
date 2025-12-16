const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
  } else {
    console.log('Verificando estructura de las tablas...');
  }
});

// Verificar estructura de la tabla zapato
db.all("PRAGMA table_info(zapato)", (err, rows) => {
  if (err) {
    console.error('Error al obtener info de tabla zapato:', err.message);
  } else {
    console.log('\n📋 Estructura de la tabla ZAPATO:');
    rows.forEach(row => {
      console.log(`  - ${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : ''} ${row.pk ? 'PRIMARY KEY' : ''}`);
    });
  }
  
  // Verificar estructura de la tabla zapato_detalle
  db.all("PRAGMA table_info(zapato_detalle)", (err, rows) => {
    if (err) {
      console.error('Error al obtener info de tabla zapato_detalle:', err.message);
    } else {
      console.log('\n📋 Estructura de la tabla ZAPATO_DETALLE:');
      rows.forEach(row => {
        console.log(`  - ${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : ''} ${row.pk ? 'PRIMARY KEY' : ''}`);
      });
    }
    
    // Verificar índices
    db.all("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='zapato'", (err, indexes) => {
      if (err) {
        console.error('Error al obtener índices:', err.message);
      } else {
        console.log('\n🔍 Índices de la tabla ZAPATO:');
        indexes.forEach(index => {
          console.log(`  - ${index.name}`);
        });
      }
      
      db.close();
      console.log('\n✅ Verificación completada.');
    });
  });
});