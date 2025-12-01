const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

const db = new sqlite3.Database('./database.sqlite');

// Ruta para registrar un nuevo usuario
router.post('/', async (req, res) => {
    try {
        console.log('=== INICIO REGISTRO ===');
        console.log('Body recibido:', req.body);
        console.log('Master password del .env:', process.env.MASTER_PASSWORD);
        
        const { username, password, masterPassword } = req.body;

        console.log('Validando contraseña maestra...');
        if (masterPassword !== process.env.MASTER_PASSWORD) {
            console.log('❌ Contraseña maestra incorrecta');
            return res.status(403).json({ message: 'Contraseña maestra incorrecta' });
        }
        console.log('✅ Contraseña maestra correcta');

    let hashedPassword;
    try {
        console.log('Hasheando password...');
        hashedPassword = await bcrypt.hash(password, 10);
        console.log('✅ Password hasheado exitosamente');
    } catch (bcryptError) {
        console.error('❌ Error en bcrypt:', bcryptError);
        return res.status(500).json({ message: 'Error al procesar la contraseña', error: bcryptError.message });
    }
    
    console.log('Intentando insertar usuario:', username);

    db.run(
        'INSERT INTO usuario (nombre, password) VALUES (?, ?)',
        [username, hashedPassword],
        function (err) {
            if (err) {
                console.error('Error en INSERT:', err.message);
                return res.status(500).json({ message: 'Error al registrar el usuario', error: err.message });
            }
            console.log('Usuario registrado con ID:', this.lastID);
            res.status(201).json({ message: 'Usuario registrado exitosamente' });
        }
    );
    
        console.log('=== FIN REGISTRO ===');
    } catch (error) {
        console.error('❌ Error general en registro:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
});

module.exports = router;