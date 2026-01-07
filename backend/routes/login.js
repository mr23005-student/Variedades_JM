const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const db = new sqlite3.Database('./database.sqlite');

// Ruta para iniciar sesión
router.post('/', (req, res) => {
    console.log(`${new Date().toISOString()} - POST /api/auth/login - IP: ${req.ip}`);
    console.log('=== INICIO LOGIN ===');
    console.log('Body recibido:', req.body);
    
    const { username, password } = req.body;

    // Validación de campos requeridos
    if (!username || !password) {
        console.log('❌ Campos faltantes en el login');
        return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
    }

    console.log(`Buscando usuario: ${username}`);
    
    db.get('SELECT * FROM usuario WHERE nombre = ?', [username], async (err, user) => {
        if (err) {
            console.error('❌ Error en DB al buscar usuario:', err.message);
            return res.status(500).json({ message: 'Error al buscar el usuario', error: err.message });
        }

        if (!user) {
            console.log('❌ Usuario no encontrado en la base de datos');
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        console.log('✅ Usuario encontrado en DB, verificando contraseña...');

        try {
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                console.log('❌ Contraseña incorrecta');
                return res.status(401).json({ message: 'Contraseña incorrecta' });
            }

            console.log('✅ Contraseña correcta, generando token JWT...');

            // Generar token JWT
            const token = jwt.sign(
                { 
                    id: user.id, 
                    username: user.nombre 
                },
                process.env.JWT_SECRET || 'secreto-temporal',
                { expiresIn: '24h' }
            );

            console.log('✅ Token JWT generado exitosamente');
            console.log('=== FIN LOGIN ===');

            res.status(200).json({ 
                message: 'Inicio de sesión exitoso',
                token: token,
                user: {
                    id: user.id,
                    username: user.nombre
                }
            });

        } catch (bcryptError) {
            console.error('❌ Error en bcrypt.compare:', bcryptError.message);
            return res.status(500).json({ 
                message: 'Error al verificar la contraseña',
                error: bcryptError.message 
            });
        }
    });
});

module.exports = router;