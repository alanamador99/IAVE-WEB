import app from './app.js';
import { DB_SERVER, PORT } from "./config.js";

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend corriendo en http://${DB_SERVER}:${PORT}`); //Esto es lo primero en ejecutarse, pero al hacer la llamada a <app> se inicializa el componente 
  // Con todo lo que ya se definió de Exprees, morgan (solo en modo DEV, cuando se construye el compilado para producción se omite el uso de Morgan) y CORS
});





app.get('/', async (req, res) => {
  try {
    res.send(`🚀 Backend corriendo en http://${DB_SERVER}:${PORT}`);
  } catch (err) {
    console.error('❌ Error: ', err);
    res.status(500).send('Error al conectar con la base de datos');
  }
});