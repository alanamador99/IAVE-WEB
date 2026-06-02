// connection.js
import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();
/*


6.tcp.ngrok.io,13993
2.tcp.us-cal-1.ngrok.io,16696

port: 1433,

Datos de conexión para ngrok
server: '2.tcp.us-cal-1.ngrok.io',

Datos de conexión para producción
server: 'server-datos', 
port: 1433,
password: 'IaveATM_2025!',
// */
const dbConfig = {
  server: '20.15.201.237',
  port: 1433,
  password: 'WebATM_2026!',
  user: 'IAVE',
  database: 'Tusa',
  options: {
    encrypt: false,
    trustServerCertificate: true, // Para certificados autofirmados
    connectTimeout: 30000,
    requestTimeout: 300000,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 1,
    idleTimeoutMillis: 30000,
  },
  // Forzar TCP (evitar pipes en Windows)
  dialectOptions: {
    instanceName: 'MSSQLSERVER',
    options: {
      useUTC: false,
    },
  },
};


const getConnection = async () => {
  try {
    const pool = await new sql.ConnectionPool(dbConfig).connect();
    return pool;
  } catch (error) {
    console.error('❌ Error conexión principal:', error);
  }
};


getConnection().then(() => console.log("✅ Conexión a Tusa OK"));

export { getConnection, sql };





