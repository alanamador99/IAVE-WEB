import app from './app.js';
import { DB_SERVER, PORT } from "./config.js";

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend corriendo en http://${DB_SERVER}:${PORT}`);
});





app.get('/', async (req, res) => {
  try {
    res.send(`🚀 Backend corriendo en http://localhost:${PORT}`);
  } catch (err) {
    console.error('❌ Error: ', err);
    res.status(500).send('Error al conectar con la base de datos →index.js API');
  }
});


