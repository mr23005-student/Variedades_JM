const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite');

// Obtener estadísticas del dashboard
router.get('/', (req, res) => {
    console.log(`${new Date().toISOString()} - GET /api/stats - IP: ${req.ip}`);
    console.log('=== OBTENIENDO ESTADÍSTICAS ===');

    // Consultas para obtener estadísticas
    const stats = {};

    // Contar zapatos disponibles en stock (solo activos, excluyendo vendidos)
    db.get('SELECT COUNT(*) as totalZapatos FROM zapato WHERE estado = "activo"', (err, row) => {
        if (err) {
            console.error('❌ Error obteniendo total de zapatos:', err.message);
            return res.status(500).json({ message: 'Error obteniendo estadísticas' });
        }
        
        stats.totalZapatos = row.totalZapatos || 0;
        console.log(`📊 Total zapatos en stock: ${stats.totalZapatos}`);

        // Contar ventas individuales de hoy (zapatos vendidos, no operaciones)
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        db.get(
            `SELECT COUNT(DISTINCT dv.id) as ventasHoy 
             FROM detalle_ventas dv
             JOIN ventas v ON dv.venta_id = v.id
             WHERE DATE(v.fecha) = ? AND dv.tipo = 'venta'`, 
            [today], 
            (err, row) => {
                if (err) {
                    console.error('❌ Error obteniendo ventas de hoy:', err.message);
                    return res.status(500).json({ message: 'Error obteniendo estadísticas' });
                }
                
                stats.ventasHoy = row.ventasHoy || 0;
                console.log(`📈 Ventas de hoy: ${stats.ventasHoy}`);

                // Obtener valor total de ventas de hoy
                db.get(
                    `SELECT COALESCE(SUM(dv.precio_venta), 0) as totalVentasHoy 
                     FROM detalle_ventas dv
                     JOIN ventas v ON dv.venta_id = v.id
                     WHERE DATE(v.fecha) = ? AND dv.tipo = 'venta'`,
                    [today],
                    (err, row) => {
                        if (err) {
                            console.error('❌ Error obteniendo total ventas de hoy:', err.message);
                            return res.status(500).json({ message: 'Error obteniendo estadísticas' });
                        }

                        stats.totalVentasHoy = row.totalVentasHoy || 0;
                        console.log(`💰 Total ventas hoy: $${stats.totalVentasHoy}`);

                        // Obtener total de clientes registrados
                        db.get('SELECT COUNT(*) as totalClientes FROM cliente', (err, row) => {
                            if (err) {
                                console.error('❌ Error obteniendo total de clientes:', err.message);
                                return res.status(500).json({ message: 'Error obteniendo estadísticas' });
                            }

                            stats.totalClientes = row.totalClientes || 0;
                            console.log(`👥 Total clientes: ${stats.totalClientes}`);

                            // Obtener reservas activas de la tabla reservas (no de ventas)
                            db.get(
                                'SELECT COUNT(*) as reservasPendientes FROM reservas WHERE estado = ?', 
                                ['activa'],
                                (err, row) => {
                                    if (err) {
                                        console.error('❌ Error obteniendo reservas pendientes:', err.message);
                                        return res.status(500).json({ message: 'Error obteniendo estadísticas' });
                                    }

                                    stats.reservasPendientes = row.reservasPendientes || 0;
                                    console.log(`📋 Reservas activas: ${stats.reservasPendientes}`);

                                console.log('✅ Estadísticas obtenidas exitosamente');
                                console.log('=== FIN ESTADÍSTICAS ===');
                                
                                res.json({
                                    success: true,
                                    data: stats
                                });
                            });
                        });
                    }
                );
            }
        );
    });
});

// Obtener actividad reciente
router.get('/activity', (req, res) => {
    console.log(`${new Date().toISOString()} - GET /api/stats/activity - IP: ${req.ip}`);
    
    const activity = [];
    
    // Últimas ventas y reservas
    db.all(
        `SELECT v.tipo, c.nombre as cliente, v.total, v.fecha
         FROM ventas v
         JOIN cliente c ON v.cliente_id = c.id
         ORDER BY v.fecha DESC 
         LIMIT 3`,
        (err, rows) => {
            if (err) {
                console.error('❌ Error obteniendo actividad de ventas:', err.message);
            } else {
                rows.forEach(row => {
                    const isVenta = row.tipo === 'venta' || row.tipo === 'mixta';
                    activity.push({
                        id: `${row.tipo}-${Date.now()}-${Math.random()}`,
                        action: `${isVenta ? 'Venta' : 'Reservación'} realizada - ${row.cliente} ($${row.total})`,
                        time: getTimeAgo(row.fecha),
                        icon: isVenta ? 'shopping_cart' : 'bookmark',
                        color: isVenta ? 'green' : 'orange'
                    });
                });
            }

            // Últimos clientes registrados (sin fecha porque no existe en la tabla)
            db.all(
                'SELECT nombre, id FROM cliente ORDER BY id DESC LIMIT 2',
                (err, rows) => {
                    if (err) {
                        console.error('❌ Error obteniendo actividad de clientes:', err.message);
                    } else {
                        rows.forEach(row => {
                            activity.push({
                                id: `cliente-${Date.now()}-${Math.random()}`,
                                action: `Cliente registrado - ${row.nombre}`,
                                time: 'Recientemente', // Sin fecha específica
                                icon: 'person_add',
                                color: 'blue'
                            });
                        });
                    }

                    // Últimos productos agregados
                    db.all(
                        'SELECT marca, modelo, fecha_registro FROM zapato ORDER BY fecha_registro DESC LIMIT 2',
                        (err, rows) => {
                            if (err) {
                                console.error('❌ Error obteniendo actividad de productos:', err.message);
                            } else {
                                rows.forEach(row => {
                                    activity.push({
                                        id: `producto-${Date.now()}-${Math.random()}`,
                                        action: `Producto agregado - ${row.marca} ${row.modelo}`,
                                        time: getTimeAgo(row.fecha_registro),
                                        icon: 'add_box',
                                        color: 'purple'
                                    });
                                });
                            }

                            // Ordenar por más reciente
                            activity.sort((a, b) => new Date(b.time) - new Date(a.time));

                            res.json({
                                success: true,
                                data: activity.slice(0, 5) // Máximo 5 actividades
                            });
                        }
                    );
                }
            );
        }
    );
});

// Función auxiliar para calcular tiempo transcurrido
function getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
}

module.exports = router;