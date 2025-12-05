const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const { TIMEZONE_OFFSET_SECONDS } = require('../config/constants');

const db = new sqlite3.Database('./database.sqlite');

// GET - Ventas por día con detalle de zapatos y ganancias
router.get('/ventas-por-dia/:fecha', (req, res) => {
  const { fecha } = req.params;
  console.log(`📅 Obteniendo ventas para fecha: ${fecha}`);

  // Consulta para obtener todos los zapatos vendidos en una fecha específica
  const queryZapatos = `
    SELECT 
      z.id,
      z.marca,
      z.modelo, 
      zd.talla,
      zd.precio_compra,
      dv.precio_venta as precio_vendido,
      (dv.precio_venta - zd.precio_compra) as ganancia,
      c.nombre as cliente_nombre,
      strftime('%H:%M', v.fecha) as hora_venta,
      v.fecha as fecha_completa
    FROM ventas v
    JOIN detalle_ventas dv ON v.id = dv.venta_id
    JOIN zapato z ON dv.zapato_id = z.id
    JOIN zapato_detalle zd ON z.id = zd.id_zapato
    JOIN cliente c ON v.cliente_id = c.id
    WHERE DATE(v.fecha) = ? 
    AND (v.tipo = 'venta' OR dv.tipo = 'venta')
    ORDER BY v.fecha DESC
  `;

  // Consulta para resumen del día
  const queryResumen = `
    SELECT 
      COUNT(dv.id) as totalZapatos,
      COALESCE(SUM(dv.precio_venta), 0) as totalVentas,
      COALESCE(SUM(zd.precio_compra), 0) as totalInversion,
      COALESCE(SUM(dv.precio_venta - zd.precio_compra), 0) as gananciaTotal
    FROM ventas v
    JOIN detalle_ventas dv ON v.id = dv.venta_id
    JOIN zapato z ON dv.zapato_id = z.id
    JOIN zapato_detalle zd ON z.id = zd.id_zapato
    WHERE DATE(v.fecha) = ?
    AND (v.tipo = 'venta' OR dv.tipo = 'venta')
  `;

  // Ejecutar consulta de zapatos
  db.all(queryZapatos, [fecha], (err, zapatos) => {
    if (err) {
      console.error('❌ Error obteniendo zapatos vendidos:', err);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener zapatos vendidos'
      });
    }

    // Ejecutar consulta de resumen
    db.get(queryResumen, [fecha], (err, resumen) => {
      if (err) {
        console.error('❌ Error obteniendo resumen:', err);
        return res.status(500).json({
          success: false,
          message: 'Error al obtener resumen del día'
        });
      }

      console.log(`✅ Encontrados ${zapatos.length} zapatos vendidos`);
      console.log('📊 Resumen:', resumen);

      res.json({
        success: true,
        data: {
          fecha: fecha,
          zapatos: zapatos || [],
          resumen: resumen || {
            totalZapatos: 0,
            totalVentas: 0,
            totalInversion: 0,
            gananciaTotal: 0
          }
        }
      });
    });
  });
});

// GET - Dashboard general
router.get('/dashboard', (req, res) => {
  const queries = {
    // Total de zapatos en inventario (solo activos, excluyendo vendidos)
    totalZapatos: 'SELECT COUNT(*) as total FROM zapato WHERE estado = "activo"',
    
    // Total de clientes
    totalClientes: 'SELECT COUNT(*) as total FROM cliente',
    
    // Reservas pendientes
    reservasPendientes: 'SELECT COUNT(*) as total FROM reservas WHERE estado = "pendiente"',
    
    // Ventas del mes actual
    ventasMes: `
      SELECT COUNT(*) as total_ventas, COALESCE(SUM(total), 0) as total_ingresos
      FROM facturacion 
      WHERE strftime('%Y-%m', fecha_factura) = strftime('%Y-%m', 'now')
    `,
    
    // Ventas del día actual
    ventasDia: `
      SELECT COUNT(*) as total_ventas, COALESCE(SUM(total), 0) as total_ingresos
      FROM facturacion 
      WHERE DATE(fecha_factura) = DATE('now')
    `
  };
  
  const results = {};
  let completedQueries = 0;
  
  Object.keys(queries).forEach(key => {
    db.get(queries[key], [], (err, row) => {
      if (err) {
        results[key] = { error: err.message };
      } else {
        results[key] = row;
      }
      
      completedQueries++;
      if (completedQueries === Object.keys(queries).length) {
        res.json(results);
      }
    });
  });
});

// GET - Reporte de ventas por período
router.get('/ventas', (req, res) => {
  const { fecha_desde, fecha_hasta, grupo = 'dia' } = req.query;
  
  let groupBy = '';
  let selectDate = '';
  
  switch (grupo) {
    case 'dia':
      groupBy = 'DATE(fecha_factura)';
      selectDate = 'DATE(fecha_factura) as fecha';
      break;
    case 'mes':
      groupBy = 'strftime("%Y-%m", fecha_factura)';
      selectDate = 'strftime("%Y-%m", fecha_factura) as fecha';
      break;
    case 'año':
      groupBy = 'strftime("%Y", fecha_factura)';
      selectDate = 'strftime("%Y", fecha_factura) as fecha';
      break;
    default:
      groupBy = 'DATE(fecha_factura)';
      selectDate = 'DATE(fecha_factura) as fecha';
  }
  
  let query = `
    SELECT 
      ${selectDate},
      COUNT(*) as total_ventas,
      SUM(total) as total_ingresos,
      SUM(descuento) as total_descuentos,
      AVG(total) as promedio_venta,
      SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END) as efectivo,
      SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total ELSE 0 END) as tarjeta,
      SUM(CASE WHEN metodo_pago = 'transferencia' THEN total ELSE 0 END) as transferencia,
      SUM(CASE WHEN metodo_pago = 'mixto' THEN total ELSE 0 END) as mixto
    FROM facturacion
    WHERE 1=1
  `;
  
  const params = [];
  
  if (fecha_desde) {
    query += ' AND DATE(fecha_factura) >= ?';
    params.push(fecha_desde);
  }
  
  if (fecha_hasta) {
    query += ' AND DATE(fecha_factura) <= ?';
    params.push(fecha_hasta);
  }
  
  query += ` GROUP BY ${groupBy} ORDER BY fecha DESC`;
  
  db.all(query, params, (err, ventas) => {
    if (err) {
      return res.status(500).json({ message: 'Error al generar reporte de ventas', error: err.message });
    }
    
    // Calcular totales generales
    const totales = ventas.reduce((acc, venta) => ({
      total_ventas: acc.total_ventas + venta.total_ventas,
      total_ingresos: acc.total_ingresos + venta.total_ingresos,
      total_descuentos: acc.total_descuentos + venta.total_descuentos,
      efectivo: acc.efectivo + venta.efectivo,
      tarjeta: acc.tarjeta + venta.tarjeta,
      transferencia: acc.transferencia + venta.transferencia,
      mixto: acc.mixto + venta.mixto
    }), {
      total_ventas: 0,
      total_ingresos: 0,
      total_descuentos: 0,
      efectivo: 0,
      tarjeta: 0,
      transferencia: 0,
      mixto: 0
    });
    
    res.json({
      periodo: { fecha_desde, fecha_hasta, grupo },
      datos: ventas,
      totales
    });
  });
});

// GET - Reporte de inventario
router.get('/inventario', (req, res) => {
  const queries = {
    // Resumen por estado
    porEstado: `
      SELECT estado, COUNT(*) as cantidad, AVG(precio) as precio_promedio
      FROM zapato 
      GROUP BY estado
    `,
    
    // Resumen por marca
    porMarca: `
      SELECT marca, COUNT(*) as cantidad, AVG(precio) as precio_promedio
      FROM zapato 
      GROUP BY marca
      ORDER BY cantidad DESC
    `,
    
    // Resumen por género
    porGenero: `
      SELECT genero, COUNT(*) as cantidad, AVG(precio) as precio_promedio
      FROM zapato 
      GROUP BY genero
    `,
    
    // Zapatos más caros
    masCaro: `
      SELECT marca, modelo, talla, precio, color
      FROM zapato 
      ORDER BY precio DESC 
      LIMIT 10
    `,
    
    // Zapatos más baratos
    masBarato: `
      SELECT marca, modelo, talla, precio, color
      FROM zapato 
      ORDER BY precio ASC 
      LIMIT 10
    `,
    
    // Total del inventario (solo zapatos activos disponibles)
    valorTotal: `
      SELECT 
        COUNT(*) as total_zapatos,
        SUM(precio) as valor_total,
        AVG(precio) as precio_promedio,
        MIN(precio) as precio_minimo,
        MAX(precio) as precio_maximo
      FROM zapato
      WHERE estado = 'activo'
    `
  };
  
  const results = {};
  let completedQueries = 0;
  
  Object.keys(queries).forEach(key => {
    db.all(queries[key], [], (err, rows) => {
      if (err) {
        results[key] = { error: err.message };
      } else {
        results[key] = rows;
      }
      
      completedQueries++;
      if (completedQueries === Object.keys(queries).length) {
        res.json(results);
      }
    });
  });
});

// GET - Reporte de clientes
router.get('/clientes', (req, res) => {
  const queries = {
    // Top clientes por compras
    topClientes: `
      SELECT 
        c.nombre,
        c.apellido,
        c.cedula,
        c.telefono,
        COUNT(f.id) as total_compras,
        SUM(f.total) as total_gastado,
        AVG(f.total) as promedio_compra,
        MAX(f.fecha_factura) as ultima_compra
      FROM cliente c
      LEFT JOIN facturacion f ON c.id = f.cliente_id
      GROUP BY c.id
      HAVING total_compras > 0
      ORDER BY total_gastado DESC
      LIMIT 20
    `,
    
    // Clientes nuevos (registrados en los últimos 30 días)
    clientesNuevos: `
      SELECT 
        nombre,
        apellido,
        cedula,
        telefono,
        fecha_registro
      FROM cliente 
      WHERE DATE(fecha_registro) >= DATE('now', '-30 days')
      ORDER BY fecha_registro DESC
    `,
    
    // Clientes sin compras
    sinCompras: `
      SELECT 
        c.nombre,
        c.apellido,
        c.cedula,
        c.telefono,
        c.fecha_registro
      FROM cliente c
      LEFT JOIN facturacion f ON c.id = f.cliente_id
      WHERE f.id IS NULL
      ORDER BY c.fecha_registro DESC
    `,
    
    // Resumen general
    resumenGeneral: `
      SELECT 
        COUNT(DISTINCT c.id) as total_clientes,
        COUNT(DISTINCT f.cliente_id) as clientes_activos,
        COUNT(DISTINCT c.id) - COUNT(DISTINCT f.cliente_id) as clientes_sin_compras
      FROM cliente c
      LEFT JOIN facturacion f ON c.id = f.cliente_id
    `
  };
  
  const results = {};
  let completedQueries = 0;
  
  Object.keys(queries).forEach(key => {
    db.all(queries[key], [], (err, rows) => {
      if (err) {
        results[key] = { error: err.message };
      } else {
        results[key] = rows;
      }
      
      completedQueries++;
      if (completedQueries === Object.keys(queries).length) {
        res.json(results);
      }
    });
  });
});

// GET - Reporte de reservas
router.get('/reservas', (req, res) => {
  const queries = {
    // Resumen por estado
    porEstado: `
      SELECT estado, COUNT(*) as cantidad
      FROM reservas 
      GROUP BY estado
    `,
    
    // Reservas próximas a vencer (próximos 7 días)
    proximasVencer: `
      SELECT 
        r.id,
        r.fecha_vencimiento,
        r.abono,
        r.saldo_pendiente,
        c.nombre as cliente_nombre,
        c.apellido as cliente_apellido,
        c.telefono,
        z.marca,
        z.modelo,
        z.talla,
        z.precio
      FROM reservas r
      INNER JOIN cliente c ON r.cliente_id = c.id
      INNER JOIN zapato z ON r.zapato_id = z.id
      WHERE r.estado = 'pendiente' 
        AND DATE(r.fecha_vencimiento) BETWEEN DATE('now') AND DATE('now', '+7 days')
      ORDER BY r.fecha_vencimiento ASC
    `,
    
    // Reservas vencidas
    vencidas: `
      SELECT 
        r.id,
        r.fecha_vencimiento,
        r.abono,
        r.saldo_pendiente,
        c.nombre as cliente_nombre,
        c.apellido as cliente_apellido,
        c.telefono,
        z.marca,
        z.modelo,
        z.talla,
        z.precio
      FROM reservas r
      INNER JOIN cliente c ON r.cliente_id = c.id
      INNER JOIN zapato z ON r.zapato_id = z.id
      WHERE r.fecha_vencimiento < DATE('now') AND r.estado = 'pendiente'
      ORDER BY r.fecha_vencimiento ASC
    `,
    
    // Resumen financiero
    resumenFinanciero: `
      SELECT 
        COUNT(*) as total_reservas,
        SUM(abono) as total_abonos,
        SUM(saldo_pendiente) as total_saldos_pendientes,
        AVG(abono) as promedio_abono
      FROM reservas
      WHERE estado = 'pendiente'
    `
  };
  
  const results = {};
  let completedQueries = 0;
  
  Object.keys(queries).forEach(key => {
    db.all(queries[key], [], (err, rows) => {
      if (err) {
        results[key] = { error: err.message };
      } else {
        results[key] = rows;
      }
      
      completedQueries++;
      if (completedQueries === Object.keys(queries).length) {
        res.json(results);
      }
    });
  });
});

// GET - Productos más vendidos
router.get('/productos-mas-vendidos', (req, res) => {
  const { limite = 10, fecha_desde, fecha_hasta } = req.query;
  
  let query = `
    SELECT 
      z.marca,
      z.modelo,
      z.talla,
      z.color,
      z.precio,
      COUNT(f.id) as total_vendidos,
      SUM(f.total) as ingresos_totales,
      AVG(f.total) as precio_promedio_venta
    FROM zapato z
    INNER JOIN facturacion f ON z.id = f.zapato_id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (fecha_desde) {
    query += ' AND DATE(f.fecha_factura) >= ?';
    params.push(fecha_desde);
  }
  
  if (fecha_hasta) {
    query += ' AND DATE(f.fecha_factura) <= ?';
    params.push(fecha_hasta);
  }
  
  query += `
    GROUP BY z.marca, z.modelo, z.talla, z.color
    ORDER BY total_vendidos DESC, ingresos_totales DESC
    LIMIT ?
  `;
  
  params.push(parseInt(limite));
  
  db.all(query, params, (err, productos) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener productos más vendidos', error: err.message });
    }
    
    res.json(productos);
  });
});

// GET - Análisis de tendencias por mes
router.get('/tendencias', (req, res) => {
  const query = `
    SELECT 
      strftime('%Y-%m', f.fecha_factura) as mes,
      COUNT(f.id) as total_ventas,
      SUM(f.total) as ingresos,
      COUNT(DISTINCT f.cliente_id) as clientes_unicos,
      AVG(f.total) as ticket_promedio,
      
      -- Análisis por género
      SUM(CASE WHEN z.genero = 'masculino' THEN 1 ELSE 0 END) as ventas_masculino,
      SUM(CASE WHEN z.genero = 'femenino' THEN 1 ELSE 0 END) as ventas_femenino,
      SUM(CASE WHEN z.genero = 'unisex' THEN 1 ELSE 0 END) as ventas_unisex,
      
      -- Análisis por estado del zapato
      SUM(CASE WHEN z.estado = 'nuevo' THEN 1 ELSE 0 END) as ventas_nuevos,
      SUM(CASE WHEN z.estado = 'seminuevo' THEN 1 ELSE 0 END) as ventas_seminuevos,
      SUM(CASE WHEN z.estado = 'usado' THEN 1 ELSE 0 END) as ventas_usados,
      
      -- Top marca del mes
      (SELECT z2.marca FROM zapato z2 
       INNER JOIN facturacion f2 ON z2.id = f2.zapato_id 
       WHERE strftime('%Y-%m', f2.fecha_factura) = strftime('%Y-%m', f.fecha_factura)
       GROUP BY z2.marca 
       ORDER BY COUNT(*) DESC 
       LIMIT 1) as marca_top
       
    FROM facturacion f
    INNER JOIN zapato z ON f.zapato_id = z.id
    GROUP BY strftime('%Y-%m', f.fecha_factura)
    ORDER BY mes DESC
    LIMIT 12
  `;
  
  db.all(query, [], (err, tendencias) => {
    if (err) {
      return res.status(500).json({ message: 'Error al generar análisis de tendencias', error: err.message });
    }
    
    res.json(tendencias);
  });
});

// GET - Exportar datos (CSV-like format)
router.get('/exportar/:tipo', (req, res) => {
  const { tipo } = req.params;
  const { fecha_desde, fecha_hasta } = req.query;
  
  let query = '';
  let params = [];
  
  switch (tipo) {
    case 'ventas':
      query = `
        SELECT 
          f.numero_factura,
          f.fecha_factura,
          c.nombre || ' ' || c.apellido as cliente,
          c.cedula,
          z.marca || ' ' || z.modelo as producto,
          z.talla,
          z.color,
          f.subtotal,
          f.descuento,
          f.total,
          f.metodo_pago
        FROM facturacion f
        INNER JOIN cliente c ON f.cliente_id = c.id
        INNER JOIN zapato z ON f.zapato_id = z.id
        WHERE 1=1
      `;
      break;
      
    case 'inventario':
      query = `
        SELECT 
          marca,
          modelo,
          talla,
          precio,
          estado,
          genero,
          color,
          material,
          fecha_ingreso
        FROM zapato
        ORDER BY fecha_ingreso DESC
      `;
      break;
      
    case 'clientes':
      query = `
        SELECT 
          nombre,
          apellido,
          cedula,
          telefono,
          email,
          direccion,
          fecha_registro
        FROM cliente
        ORDER BY fecha_registro DESC
      `;
      break;
      
    default:
      return res.status(400).json({ message: 'Tipo de exportación no válido' });
  }
  
  if (tipo === 'ventas' && fecha_desde) {
    query += ' AND DATE(f.fecha_factura) >= ?';
    params.push(fecha_desde);
  }
  
  if (tipo === 'ventas' && fecha_hasta) {
    query += ' AND DATE(f.fecha_factura) <= ?';
    params.push(fecha_hasta);
  }
  
  db.all(query, params, (err, datos) => {
    if (err) {
      return res.status(500).json({ message: 'Error al exportar datos', error: err.message });
    }
    
    res.json({
      tipo,
      total_registros: datos.length,
      datos
    });
  });
});

// GET - Verificar conteo de zapatos por estado
router.get('/zapatos-por-estado', (req, res) => {
  const query = `
    SELECT 
      estado,
      COUNT(*) as cantidad,
      ROUND(AVG(precio), 2) as precio_promedio,
      SUM(precio) as valor_total
    FROM zapato 
    GROUP BY estado
    ORDER BY cantidad DESC
  `;
  
  db.all(query, [], (err, resultados) => {
    if (err) {
      return res.status(500).json({ 
        message: 'Error al obtener conteo por estado', 
        error: err.message 
      });
    }
    
    res.json({
      success: true,
      conteo_por_estado: resultados,
      timestamp: new Date().toISOString()
    });
  });
});

module.exports = router;