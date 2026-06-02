import app from './app.js';
import { DB_SERVER, PORT, SERVER } from "./config.js";
import os from 'os';

app.listen(PORT, '0.0.0.0', () => {
  const ipAddress = os.networkInterfaces()['Ethernet']?.[0]?.address || 'localhost'; // Para obtener la IP de la máquina virtual donde corre el servidor
  console.log(`🚀 Backend corriendo en http://${ipAddress}:${PORT}`);
  // Con todo lo que ya se definió de Exprees, morgan (solo en modo DEV, cuando se construye el compilado para producción se omite el uso de Morgan) y CORS
});





app.get('/', async (req, res) => {
  try {
    res.send(`🚀🚀🚀 Backend corriendo en http://${DB_SERVER}:${PORT}`);
  } catch (err) {
    console.error('❌ Error: ', err);
    res.status(500).send('Error al conectar con la base de datos');
  }
});