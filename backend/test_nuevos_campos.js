const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite');

const testNuevosCampos = async () => {
  console.log('🧪 Probando nuevos campos agregados...\n');
  
  // Insertar un zapato de prueba con código
  const zapatoQuery = `
    INSERT INTO zapato (marca, modelo, codigo, estado, fecha_registro)
    VALUES (?, ?, ?, ?, datetime('now'))
  `;
  
  const zapatoData = ['Nike', 'Air Max', 'NIKE-AM-001', 'nuevo'];
  
  db.run(zapatoQuery, zapatoData, function(err) {
    if (err) {
      console.error('❌ Error al insertar zapato:', err.message);
      return;
    }
    
    const zapatoId = this.lastID;
    console.log('✅ Zapato insertado con ID:', zapatoId);
    
    // Insertar detalle con precio_vendido
    const detalleQuery = `
      INSERT INTO zapato_detalle (id_zapato, talla, cm, precio_compra, precio_venta, precio_vendido, imagen)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const detalleData = [zapatoId, '42', 26.5, 80000, 120000, 110000, 'nike_airmax.jpg'];
    
    db.run(detalleQuery, detalleData, function(err) {
      if (err) {
        console.error('❌ Error al insertar detalle:', err.message);
        return;
      }
      
      console.log('✅ Detalle insertado con ID:', this.lastID);
      
      // Consultar el zapato completo
      const queryCompleta = `
        SELECT z.*, zd.talla, zd.cm, zd.precio_compra, zd.precio_venta, zd.precio_vendido, zd.imagen
        FROM zapato z
        LEFT JOIN zapato_detalle zd ON z.id = zd.id_zapato
        WHERE z.codigo = ?
      `;
      
      db.get(queryCompleta, ['NIKE-AM-001'], (err, zapato) => {
        if (err) {
          console.error('❌ Error al consultar zapato:', err.message);
          return;
        }
        
        console.log('\n📊 Zapato creado exitosamente:');
        console.log('ID:', zapato.id);
        console.log('Marca:', zapato.marca);
        console.log('Modelo:', zapato.modelo);
        console.log('Código:', zapato.codigo);
        console.log('Estado:', zapato.estado);
        console.log('Talla:', zapato.talla);
        console.log('Precio Compra:', zapato.precio_compra);
        console.log('Precio Venta:', zapato.precio_venta);
        console.log('Precio Vendido:', zapato.precio_vendido);
        
        // Probar búsqueda por código
        console.log('\n🔍 Probando búsqueda por código...');
        db.get(queryCompleta, ['NIKE-AM-001'], (err, found) => {
          if (found) {
            console.log('✅ Búsqueda por código exitosa');
            console.log('Zapato encontrado:', found.marca, found.modelo);
          } else {
            console.log('❌ No se encontró zapato por código');
          }
          
          // Limpiar datos de prueba
          console.log('\n🧹 Limpiando datos de prueba...');
          db.run('DELETE FROM zapato_detalle WHERE id_zapato = ?', [zapatoId], (err) => {
            if (err) console.error('Error al limpiar detalle:', err.message);
            
            db.run('DELETE FROM zapato WHERE id = ?', [zapatoId], (err) => {
              if (err) console.error('Error al limpiar zapato:', err.message);
              else console.log('✅ Datos de prueba limpiados');
              
              db.close();
              console.log('\n🎉 Prueba completada exitosamente!');
            });
          });
        });
      });
    });
  });
};

testNuevosCampos();