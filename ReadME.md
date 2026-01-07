# 👟 Variedades JM - Sistema de Gestión de Ventas de Zapatos

Sistema completo de gestión de ventas para tienda de zapatos desarrollado con tecnologías modernas.

## 🚀 Características

### ✨ Frontend
- **Framework**: Quasar Framework (Vue 3)
- **Interfaz moderna** y responsive
- **Sistema de autenticación** con páginas de login y registro
- **Navegación automática** al sistema de login
- **Notificaciones** integradas para feedback del usuario

### 🔧 Backend
- **Framework**: Express.js + Node.js
- **Base de datos**: SQLite con esquemas optimizados
- **Autenticación segura** con bcrypt y JWT
- **API RESTful completa** para todas las operaciones
- **Middleware de seguridad** (CORS, rate limiting, headers seguros)

### 🏪 Módulos del Sistema
- **👤 Gestión de Usuarios**: Registro y autenticación con contraseña maestra
- **👟 Inventario de Zapatos**: CRUD completo para productos
- **🙋‍♂️ Gestión de Clientes**: Administración de base de clientes
- **📅 Sistema de Reservas**: Manejo de reservas y apartados
- **💰 Facturación**: Generación y gestión de facturas
- **📊 Reportes**: Sistema completo de reportes y análisis

## 🛠️ Tecnologías Utilizadas

### Frontend
```
- Quasar Framework v2.18.6
- Vue 3 (Composition API)
- Axios para HTTP requests
- Vue Router para navegación
- Quasar Components & Plugins
```

### Backend
```
- Express.js
- SQLite3
- bcrypt (encriptación de contraseñas)
- jsonwebtoken (JWT)
- express-validator (validación)
- express-rate-limit
- helmet (seguridad)
- cors
- dotenv (variables de entorno)
```

## 📋 Requisitos Previos

- **Node.js** v16 o superior
- **npm** o **yarn**
- **Quasar CLI** (para desarrollo frontend)

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/mr23005-student/Variedades_JM.git
cd Variedades_JM
```

### 2. Configurar Backend
```bash
cd backend
npm install

# Crear archivo .env
echo "MASTER_PASSWORD=Dios_es_bueno21" > .env
echo "JWT_SECRET=mi-clave-secreta-jwt-variedades-jm-2025" >> .env

# Inicializar base de datos
node database.js
```

### 3. Configurar Frontend
```bash
cd ../frontend
npm install

# Instalar Quasar CLI globalmente (si no lo tienes)
npm install -g @quasar/cli
```

## 🎯 Ejecución

### Iniciar Backend
```bash
cd backend
node server.js
```
Servidor disponible en: `http://localhost:3000`

### Iniciar Frontend
```bash
cd frontend
quasar dev
```
Aplicación disponible en: `http://localhost:9000`

## 🔑 Sistema de Autenticación

### Contraseña Maestra
Para registrar nuevos usuarios, se requiere la contraseña maestra:
```
MASTER_PASSWORD=Dios_es_bueno21
```

### Flujo de Autenticación
1. **Registro**: Requiere username, password y contraseña maestra
2. **Login**: Username y password → genera JWT token
3. **Navegación**: Redirección automática al login al iniciar la app

## 📚 API Endpoints

### Autenticación
```
POST /api/auth/register - Registrar usuario
POST /api/auth/login    - Iniciar sesión
```

### Gestión de Datos
```
/api/zapatos     - CRUD zapatos
/api/clientes    - CRUD clientes  
/api/reservas    - CRUD reservas
/api/facturacion - CRUD facturas
/api/reportes    - Generación de reportes
```

## 🗃️ Estructura de Base de Datos

### Tablas Principales
- **usuario** - Usuarios del sistema
- **zapatos** - Inventario de productos
- **clientes** - Base de clientes
- **reservas** - Sistema de apartados
- **facturacion** - Registro de ventas
- **reportes** - Datos para análisis

## 🔒 Seguridad Implementada

- ✅ **Encriptación bcrypt** para contraseñas
- ✅ **JWT tokens** para sesiones
- ✅ **Rate limiting** contra ataques
- ✅ **CORS configurado** correctamente
- ✅ **Headers de seguridad** con Helmet
- ✅ **Validación de entrada** con express-validator
- ✅ **Variables de entorno** para datos sensibles

## 🌿 Git Flow

Este proyecto usa **Git Flow** para el manejo de ramas:

```bash
# Iniciar nueva funcionalidad
git flow feature start nueva-funcionalidad

# Finalizar funcionalidad  
git flow feature finish nueva-funcionalidad

# Crear release
git flow release start v1.0.0
```

### Estructura de Ramas
- **master**: Código en producción
- **develop**: Rama de desarrollo principal
- **feature/***: Nuevas funcionalidades
- **release/***: Preparación de releases

## 🚧 Estado del Proyecto

### ✅ Completado
- [x] Sistema de autenticación completo
- [x] Backend API con todos los endpoints
- [x] Frontend con páginas de login/registro
- [x] Base de datos con esquemas completos
- [x] Middleware de seguridad
- [x] Configuración de desarrollo

### 🔄 En Desarrollo
- [ ] Dashboard principal
- [ ] Interfaz de gestión de productos
- [ ] Sistema de reportes visual
- [ ] Tests unitarios
- [ ] Documentación de API

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama feature (`git flow feature start mi-feature`)
3. Commit cambios (`git commit -m 'Agregar mi-feature'`)
4. Finalizar feature (`git flow feature finish mi-feature`)
5. Push a develop (`git push origin develop`)
6. Crear Pull Request

## 📝 Licencia

Este proyecto es propiedad de **Variedades JM**.

## 👨‍💻 Autor

**Jonathan** - Desarrollador Full Stack
- GitHub: [@mr23005-student](https://github.com/mr23005-student)

---

### 🔧 Comandos Útiles

```bash
# Limpiar base de datos
sqlite3 backend/database.sqlite "DELETE FROM usuario;"

# Ver logs del servidor
cd backend && node server.js | grep "Error\|Success"

# Rebuild frontend
cd frontend && quasar clean && quasar dev
```

### 📞 Soporte

Si tienes problemas con la instalación o configuración, verifica:
1. Versiones de Node.js y npm
2. Variables de entorno en `.env`
3. Puertos 3000 y 9000 disponibles
4. Permisos de lectura/escritura en directorio del proyecto

¡Gracias por usar Variedades JM! 👟✨