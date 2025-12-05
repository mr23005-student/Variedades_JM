const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Importar middlewares
const { 
  validateInput, 
  logRequests, 
  rateLimit, 
  securityHeaders 
} = require('./middleware');

// Importar rutas
const registerRoutes = require('./routes/register');
const loginRoutes = require('./routes/login');
const zapatosRoutes = require('./routes/zapatos');
const clientesRoutes = require('./routes/clientes');
const reservasRoutes = require('./routes/reservas');
const facturacionRoutes = require('./routes/facturacion');
const reportesRoutes = require('./routes/reportes');
const statsRoutes = require('./routes/stats');
const ventasRoutes = require('./routes/ventas');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(securityHeaders);

// CORS
app.use(cors({
  origin: ['http://localhost:9000', 'http://localhost:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middlewares personalizados
app.use(logRequests);
app.use(validateInput);
app.use(rateLimit(200, 15 * 60 * 1000)); // 200 requests por 15 minutos

// Rutas de autenticación
app.use('/api/auth/register', registerRoutes);
app.use('/api/auth/login', loginRoutes);

// Rutas principales
app.use('/api/zapatos', zapatosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/facturacion', facturacionRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/ventas', ventasRoutes);

// Ruta base
app.get('/', (req, res) => {
  res.json({
    message: 'API de Variedades JM funcionando correctamente',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      zapatos: '/api/zapatos',
      clientes: '/api/clientes', 
      reservas: '/api/reservas',
      facturacion: '/api/facturacion',
      reportes: '/api/reportes',
      stats: '/api/stats',
      ventas: '/api/ventas'
    }
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    message: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📋 Endpoints disponibles:`);
  console.log(`   • Autenticación: /api/auth`);
  console.log(`   • Zapatos: /api/zapatos`);
  console.log(`   • Clientes: /api/clientes`);
  console.log(`   • Reservas: /api/reservas`);
  console.log(`   • Facturación: /api/facturacion`);
  console.log(`   • Reportes: /api/reportes`);
  console.log(`   • Estadísticas: /api/stats`);
  console.log(`   • Ventas: /api/ventas`);
  console.log(`🔒 Rate limiting: 200 requests/15min por IP`);
});