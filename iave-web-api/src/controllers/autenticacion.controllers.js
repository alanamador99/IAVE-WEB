import { getConnection, sql } from "../database/connection.js";


export const loginAPI = async (req, res) => {
    const { userName, password } = req.body;
    try {
        /*const pool = await getConnection();
        const result = await pool.request()
            .input('userName', sql.VarChar, userName)
            .input('password', sql.VarChar, password)
            .query('SELECT * FROM Usuarios WHERE userName = @userName AND password = @password');
        if (result.recordset.length > 0) {
            res.status(200).json({ message: 'Login exitoso', user: result.recordset[0] });
        }
        else {
            res.status(401).json({ message: 'Credenciales inválidas' });
        }
        */
        console.log('Intento simulado de login:', { userName, password });
        res.status(200).json({ message: 'Login exitoso', user: { userName, role: 'admin' } });
    } catch (error) {
        console.error('Error durante el login:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }

};