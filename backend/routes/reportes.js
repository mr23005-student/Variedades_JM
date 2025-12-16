const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const { TIMEZONE_OFFSET_SECONDS } = require('../config/constants');
const PDFDocument = require('pdfkit');

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
      groupBy = 'DATE(v.fecha)';
      selectDate = 'DATE(v.fecha) as fecha';
      break;
    case 'mes':
      groupBy = 'strftime("%Y-%m", v.fecha)';
      selectDate = 'strftime("%Y-%m", v.fecha) as fecha';
      break;
    case 'año':
      groupBy = 'strftime("%Y", v.fecha)';
      selectDate = 'strftime("%Y", v.fecha) as fecha';
      break;
    default:
      groupBy = 'DATE(v.fecha)';
      selectDate = 'DATE(v.fecha) as fecha';
  }
  
  let query = `
    SELECT 
      ${selectDate},
      COUNT(DISTINCT v.id) as total_ventas,
      COALESCE(SUM(dv.precio_venta), 0) as total_ingresos,
      COALESCE(SUM(zd.precio_compra), 0) as total_inversion,
      COALESCE(SUM(dv.precio_venta - zd.precio_compra), 0) as total_ganancias,
      0 as total_descuentos,
      COALESCE(AVG(dv.precio_venta), 0) as promedio_venta,
      COALESCE(SUM(dv.precio_venta), 0) as efectivo,
      0 as tarjeta,
      0 as transferencia,
      0 as mixto
    FROM ventas v
    INNER JOIN detalle_ventas dv ON v.id = dv.venta_id
    INNER JOIN zapato z ON dv.zapato_id = z.id
    INNER JOIN zapato_detalle zd ON z.id = zd.id_zapato
    WHERE v.tipo = 'venta' AND v.estado = 'activa'
  `;
  
  const params = [];
  
  if (fecha_desde) {
    query += ' AND DATE(v.fecha) >= ?';
    params.push(fecha_desde);
  }
  
  if (fecha_hasta) {
    query += ' AND DATE(v.fecha) <= ?';
    params.push(fecha_hasta);
  }
  
  query += ` GROUP BY ${groupBy} ORDER BY fecha DESC`;
  
  db.all(query, params, (err, ventas) => {
    if (err) {
      console.error('Error en consulta de ventas:', err.message);
      return res.status(500).json({ message: 'Error al generar reporte de ventas', error: err.message });
    }
    
    // Si no hay datos, devolver estructura vacía
    if (!ventas || ventas.length === 0) {
      return res.json({
        periodo: { fecha_desde, fecha_hasta, grupo },
        datos: [],
        totales: {
          total_ventas: 0,
          total_ingresos: 0,
          total_inversion: 0,
          total_ganancias: 0,
          total_descuentos: 0,
          efectivo: 0,
          tarjeta: 0,
          transferencia: 0,
          mixto: 0
        }
      });
    }
    
    // Calcular totales generales
    const totales = ventas.reduce((acc, venta) => ({
      total_ventas: acc.total_ventas + (venta.total_ventas || 0),
      total_ingresos: acc.total_ingresos + (venta.total_ingresos || 0),
      total_inversion: acc.total_inversion + (venta.total_inversion || 0),
      total_ganancias: acc.total_ganancias + (venta.total_ganancias || 0),
      total_descuentos: acc.total_descuentos + venta.total_descuentos,
      efectivo: acc.efectivo + venta.efectivo,
      tarjeta: acc.tarjeta + venta.tarjeta,
      transferencia: acc.transferencia + venta.transferencia,
      mixto: acc.mixto + venta.mixto
    }), {
      total_ventas: 0,
      total_ingresos: 0,
      total_inversion: 0,
      total_ganancias: 0,
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
      UPPER(z.marca) as marca_normalizada,
      z.marca as marca_original,
      COUNT(*) as total_vendidos,
      COALESCE(SUM(dv.precio_venta), 0) as ingresos_totales,
      COALESCE(AVG(dv.precio_venta), 0) as precio_promedio_venta,
      GROUP_CONCAT(DISTINCT z.modelo) as modelos
    FROM zapato z
    INNER JOIN zapato_detalle zd ON z.id = zd.id_zapato
    INNER JOIN detalle_ventas dv ON z.id = dv.zapato_id
    INNER JOIN ventas v ON dv.venta_id = v.id
    WHERE v.tipo = 'venta' AND v.estado = 'activa'
  `;
  
  const params = [];
  
  if (fecha_desde) {
    query += ' AND DATE(v.fecha) >= ?';
    params.push(fecha_desde);
  }
  
  if (fecha_hasta) {
    query += ' AND DATE(v.fecha) <= ?';
    params.push(fecha_hasta);
  }
  
  query += `
    GROUP BY UPPER(z.marca)
    ORDER BY total_vendidos DESC, ingresos_totales DESC
    LIMIT ?
  `;
  
  params.push(parseInt(limite));
  
  db.all(query, params, (err, productos) => {
    if (err) {
      console.error('Error en consulta de productos más vendidos:', err.message);
      return res.status(500).json({ message: 'Error al obtener productos más vendidos', error: err.message });
    }
    
    // Si no hay productos vendidos, devolver array vacío
    res.json(productos || []);
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

// GET - Zapatos agregados por período
router.get('/zapatos-agregados', (req, res) => {
  const { fecha_desde, fecha_hasta } = req.query;
  
  let query = `
    SELECT 
      z.id,
      z.marca,
      z.modelo,
      z.estado,
      z.fecha_registro,
      zd.talla,
      zd.precio_compra,
      zd.precio_venta
    FROM zapato z
    LEFT JOIN zapato_detalle zd ON z.id = zd.id_zapato
    WHERE 1=1
  `;
  
  const params = [];
  
  if (fecha_desde) {
    query += ' AND DATE(z.fecha_registro) >= ?';
    params.push(fecha_desde);
  }
  
  if (fecha_hasta) {
    query += ' AND DATE(z.fecha_registro) <= ?';
    params.push(fecha_hasta);
  }
  
  query += ' ORDER BY z.fecha_registro DESC';
  
  db.all(query, params, (err, zapatos) => {
    if (err) {
      console.error('Error al obtener zapatos agregados:', err.message);
      return res.status(500).json({ 
        message: 'Error al obtener zapatos agregados', 
        error: err.message 
      });
    }
    
    res.json(zapatos || []);
  });
});

// GET - Clientes agregados por período
router.get('/clientes-agregados', (req, res) => {
  const { fecha_desde, fecha_hasta } = req.query;
  
  let query = `
    SELECT 
      id,
      nombre,
      apellido,
      cedula,
      telefono,
      fecha_registro
    FROM cliente
    WHERE 1=1
  `;
  
  const params = [];
  
  if (fecha_desde) {
    query += ' AND DATE(fecha_registro) >= ?';
    params.push(fecha_desde);
  }
  
  if (fecha_hasta) {
    query += ' AND DATE(fecha_registro) <= ?';
    params.push(fecha_hasta);
  }
  
  query += ' ORDER BY fecha_registro DESC';
  
  db.all(query, params, (err, clientes) => {
    if (err) {
      console.error('Error al obtener clientes agregados:', err.message);
      return res.status(500).json({ 
        message: 'Error al obtener clientes agregados', 
        error: err.message 
      });
    }
    
    res.json(clientes || []);
  });
});

// GET - Detalles de zapatos vendidos por período
router.get('/zapatos-vendidos-detalle', (req, res) => {
  const { fecha_desde, fecha_hasta } = req.query;
  
  let query = `
    SELECT 
      z.marca,
      z.modelo,
      zd.talla,
      dv.precio_venta,
      zd.precio_compra,
      (dv.precio_venta - zd.precio_compra) as ganancia,
      v.fecha as fecha_venta
    FROM ventas v
    INNER JOIN detalle_ventas dv ON v.id = dv.venta_id
    INNER JOIN zapato z ON dv.zapato_id = z.id
    INNER JOIN zapato_detalle zd ON z.id = zd.id_zapato
    WHERE v.tipo = 'venta' AND v.estado = 'activa'
  `;
  
  const params = [];
  
  if (fecha_desde) {
    query += ' AND DATE(v.fecha) >= ?';
    params.push(fecha_desde);
  }
  
  if (fecha_hasta) {
    query += ' AND DATE(v.fecha) <= ?';
    params.push(fecha_hasta);
  }
  
  query += ' ORDER BY v.fecha DESC';
  
  db.all(query, params, (err, zapatos) => {
    if (err) {
      console.error('Error al obtener detalles de zapatos vendidos:', err.message);
      return res.status(500).json({ 
        message: 'Error al obtener detalles de zapatos vendidos', 
        error: err.message 
      });
    }
    
    res.json(zapatos || []);
  });
});

// GET - Reservas agregadas por período
router.get('/reservas-agregadas', (req, res) => {
  const { fecha_desde, fecha_hasta } = req.query;
  
  let query = `
    SELECT 
      r.id,
      r.fecha_reserva,
      r.fecha_limite,
      r.monto_pagado,
      c.nombre as cliente_nombre,
      z.marca,
      z.modelo
    FROM reservas r
    INNER JOIN cliente c ON r.id_cliente = c.id
    INNER JOIN zapato z ON r.id_zapato = z.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (fecha_desde) {
    query += ' AND DATE(r.fecha_reserva) >= ?';
    params.push(fecha_desde);
  }
  
  if (fecha_hasta) {
    query += ' AND DATE(r.fecha_reserva) <= ?';
    params.push(fecha_hasta);
  }
  
  query += ' ORDER BY r.fecha_reserva DESC';
  
  db.all(query, params, (err, reservas) => {
    if (err) {
      console.error('Error al obtener reservas agregadas:', err.message);
      return res.status(500).json({ 
        message: 'Error al obtener reservas agregadas', 
        error: err.message 
      });
    }
    
    res.json(reservas || []);
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

// Ruta para reporte diario
router.get('/diario/:fecha', (req, res) => {
  const { fecha } = req.params;
  const query = `
    SELECT 
      SUM(ventas_totales) as totalVentas,
      COUNT(*) as totalReportes
    FROM reportes
    WHERE DATE(fecha) = ?`;

  db.get(query, [fecha], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener reporte diario', error: err.message });
    }
    res.json({ fecha, ...result });
  });
});

// Ruta para reporte semanal
router.get('/semanal/:fecha_inicio/:fecha_fin', (req, res) => {
  const { fecha_inicio, fecha_fin } = req.params;
  const query = `
    SELECT 
      DATE(fecha) as dia,
      SUM(ventas) as totalVentas,
      COUNT(*) as totalReportes
    FROM reportes
    WHERE DATE(fecha) BETWEEN ? AND ?
    GROUP BY dia
    ORDER BY dia ASC`;

  db.all(query, [fecha_inicio, fecha_fin], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener reporte semanal', error: err.message });
    }
    res.json({ fecha_inicio, fecha_fin, resultados: results });
  });
});

// Ruta para reporte mensual
router.get('/mensual/:mes/:año', (req, res) => {
  const { mes, año } = req.params;
  const query = `
    SELECT 
      DATE(fecha) as dia,
      SUM(ventas) as totalVentas,
      COUNT(*) as totalReportes
    FROM reportes
    WHERE strftime('%m', fecha) = ? AND strftime('%Y', fecha) = ?
    GROUP BY dia
    ORDER BY dia ASC`;

  db.all(query, [mes, año], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener reporte mensual', error: err.message });
    }
    res.json({ mes, año, resultados: results });
  });
});

// Ruta para dashboard general
router.get('/dashboard', (req, res) => {
  const queries = {
    totalVentas: 'SELECT SUM(ventas) as totalVentas FROM reportes',
    totalReportes: 'SELECT COUNT(*) as totalReportes FROM reportes',
  };

  const results = {};
  let completedQueries = 0;

  Object.keys(queries).forEach((key) => {
    db.get(queries[key], [], (err, result) => {
      if (err) {
        return res.status(500).json({ message: `Error al obtener ${key}`, error: err.message });
      }

      results[key] = result;
      completedQueries++;

      if (completedQueries === Object.keys(queries).length) {
        res.json(results);
      }
    });
  });
});

// Ruta para generar PDF de reporte diario
router.get('/diario/:fecha/pdf', (req, res) => {
  const { fecha } = req.params;
  const query = `
    SELECT 
      SUM(ventas_totales) as totalVentas,
      COUNT(*) as totalReportes
    FROM reportes
    WHERE DATE(fecha) = ?`;

  db.get(query, [fecha], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error al generar PDF', error: err.message });
    }

    // Crear documento PDF
    const doc = new PDFDocument();

    // Configurar encabezados HTTP para el PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_diario_${fecha}.pdf`);

    // Generar contenido del PDF
    doc.fontSize(20).text('Reporte Diario', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Fecha: ${fecha}`);
    doc.moveDown();

    if (result.totalVentas) {
      doc.text(`Total de Ventas: $${result.totalVentas}`);
      doc.text(`Total de Reportes: ${result.totalReportes}`);
    } else {
      doc.text('No se encontraron ventas para esta fecha.');
    }

    // Finalizar el PDF y enviarlo
    doc.end();
    doc.pipe(res);
  });
});

// Ruta para datos de gráfica de ventas diarias
router.get('/graficas/ventas-diarias/:mes/:año', (req, res) => {
  const { mes, año } = req.params;
  const query = `
    SELECT 
      DATE(fecha) as dia,
      SUM(ventas_totales) as totalVentas
    FROM reportes
    WHERE strftime('%m', fecha) = ? AND strftime('%Y', fecha) = ?
    GROUP BY dia
    ORDER BY dia ASC`;

  db.all(query, [mes, año], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener datos de ventas diarias', error: err.message });
    }
    res.json({ mes, año, resultados: results });
  });
});

// Ruta para datos de gráfica de ventas por categoría
router.get('/graficas/ventas-categorias/:mes/:año', (req, res) => {
  const { mes, año } = req.params;
  const query = `
    SELECT 
      categoria,
      SUM(ventas_totales) as totalVentas
    FROM reportes
    WHERE strftime('%m', fecha) = ? AND strftime('%Y', fecha) = ?
    GROUP BY categoria
    ORDER BY totalVentas DESC`;

  db.all(query, [mes, año], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener datos de ventas por categoría', error: err.message });
    }
    res.json({ mes, año, resultados: results });
  });
});

// Ruta para guardar reportes mensuales
router.post('/guardar', (req, res) => {
  const { fecha, ventas_totales, datos } = req.body;

  if (!fecha || !ventas_totales || !datos) {
    return res.status(400).json({ message: 'Faltan datos requeridos para guardar el reporte.' });
  }

  const query = `INSERT INTO reportes (fecha, ventas_totales, datos, tipo) VALUES (?, ?, ?, 'mensual')`;
  const params = [fecha, ventas_totales, JSON.stringify(datos)];

  db.run(query, params, function (err) {
    if (err) {
      console.error('Error al guardar el reporte:', err.message);
      return res.status(500).json({ message: 'Error al guardar el reporte.', error: err.message });
    }

    res.status(201).json({ message: 'Reporte guardado exitosamente.', id: this.lastID });
  });
});

// GET - Años disponibles de reportes guardados
router.get('/years-disponibles', (req, res) => {
  const query = `
    SELECT DISTINCT strftime('%Y', fecha) as año 
    FROM reportes 
    WHERE tipo = 'mensual' 
    ORDER BY año DESC
  `;

  db.all(query, [], (err, results) => {
    if (err) {
      console.error('Error al obtener años disponibles:', err.message);
      return res.status(500).json({ message: 'Error al obtener años disponibles', error: err.message });
    }

    const years = results.map(row => parseInt(row.año));
    res.json(years);
  });
});

// GET - Reportes guardados por año y mes
router.get('/guardados', (req, res) => {
  const { año, mes } = req.query;

  if (!año || !mes) {
    return res.status(400).json({ message: 'Se requieren año y mes' });
  }

  const query = `
    SELECT 
      id,
      fecha,
      ventas_totales,
      datos,
      tipo
    FROM reportes 
    WHERE strftime('%Y', fecha) = ? 
    AND strftime('%m', fecha) = ?
    AND tipo = 'mensual'
    ORDER BY fecha DESC
  `;

  const params = [año.toString(), mes.toString().padStart(2, '0')];

  db.all(query, params, (err, reportes) => {
    if (err) {
      console.error('Error al obtener reportes guardados:', err.message);
      return res.status(500).json({ message: 'Error al obtener reportes guardados', error: err.message });
    }

    res.json(reportes || []);
  });
});

module.exports = router;