const sql = require('mssql');

const config = {
  server: 'server-datos', // O la IP si DNS falla
  port: 1433,
  user: 'IAVE',
  password: 'IaveATM_2025!',
  database: 'Tusa',
  options: {
    encrypt: false, // Si no es Azure, prueba con false
    trustServerCertificate: true, // Para certificados autofirmados
    connectTimeout: 30000, // 30 segundos
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

async function test() {
  try {
    console.log("Intentando conexión...");
    await sql.connect(config);
    console.log("✅ Conectado a SQL Server!");
    const result = await sql.query`SELECT 1 as test`;
    console.log("Resultado:", result.recordset);
    await sql.close();
  } catch (err) {
    console.error("❌ Error detallado:", {
      message: err.message,
      code: err.code,
      originalError: err.originalError?.message,
    });
    // Debug adicional
    console.log("\n🔍 ¿Se resolvió el host?");
    require('dns').lookup('server-datos', (err, address) => {
      console.log("DNS Lookup:", address || err);
    });
  }
}

test();