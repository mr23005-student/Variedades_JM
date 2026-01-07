const sqlite3 = require('sqlite3').verbose();

console.log('🕐 Iniciando migración de zona horaria...');

const db = new sqlite3.Database('./database.sqlite');

// UTC-6 = restar 6 horas = restar 21600 segundos
const TIMEZONE_OFFSET_SECONDS = 21600;

db.serialize(() => {
  console.log('📋 Comenzando transacción...');
  db.run("BEGIN TRANSACTION");

  // Actualizar tabla ventas
  console.log('📦 Actualizando fechas en tabla ventas...');
  db.run(`
    UPDATE ventas 
    SET fecha = datetime(fecha, '-${TIMEZONE_OFFSET_SECONDS} seconds')
    WHERE fecha IS NOT NULL
  `, function(err) {
    if (err) {
      console.error('❌ Error actualizando ventas:', err);
      db.run("ROLLBACK");
      return;
    }
    console.log(`✅ Actualizados ${this.changes} registros en tabla ventas`);
  });

  // Actualizar tabla reservas (si existe)
  console.log('📝 Actualizando fechas en tabla reservas...');
  db.run(`
    UPDATE reservas 
    SET fecha_reserva = datetime(fecha_reserva, '-${TIMEZONE_OFFSET_SECONDS} seconds')
    WHERE fecha_reserva IS NOT NULL
  `, function(err) {
    if (err) {
      console.error('❌ Error actualizando reservas:', err);
      db.run("ROLLBACK");
      return;
    }
    console.log(`✅ Actualizados ${this.changes} registros en tabla reservas`);
  });

  // Actualizar tabla zapato (fecha_registro)
  console.log('👟 Actualizando fechas en tabla zapato...');
  db.run(`
    UPDATE zapato 
    SET fecha_registro = datetime(fecha_registro, '-${TIMEZONE_OFFSET_SECONDS} seconds')
    WHERE fecha_registro IS NOT NULL
  `, function(err) {
    if (err) {
      console.error('❌ Error actualizando zapatos:', err);
      db.run("ROLLBACK");
      return;
    }
    console.log(`✅ Actualizados ${this.changes} registros en tabla zapato`);
    
    // Confirmar transacción al final
    db.run("COMMIT", (err) => {
      if (err) {
        console.error('❌ Error confirmando transacción:', err);
        db.run("ROLLBACK");
      } else {
        console.log('🎉 ¡Migración completada exitosamente!');
        console.log('⏰ Todas las fechas ahora están en zona horaria El Salvador (UTC-6)');
      }
      db.close();
    });
  });

});