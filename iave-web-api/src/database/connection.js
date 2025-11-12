// connection.js
import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();
/*
server: '2.tcp.us-cal-1.ngrok.io', 
port: 14421,


2.tcp.us-cal-1.ngrok.io,14421

// */
const dbConfig = {
  server: 'server-datos', 
  port: 1433,
  user: 'IAVE',
  password: 'IaveATM_2025!',
  database: 'Tusa',
  options: {
    encrypt: false,
    trustServerCertificate: true, // Para certificados autofirmados
    connectTimeout: 30000,
    requestTimeout: 30000,
    enableArithAbort: true,
  },
  pool: {
    max: 1,
    min: 0,
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
