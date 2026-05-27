
import { getConnection } from './iave-web-api/src/database/connection.js';

async function test() {
  const pool = await getConnection();
  try {
    const res1 = await pool.request().query('SELECT TOP 1 * FROM Control_Tags WHERE Dispositivo IS NOT NULL;');
    console.log('Control_Tags:', res1.recordset[0]);
    if (res1.recordset[0]) {
      const id = res1.recordset[0].id_control_tags;
      const res2 = await pool.request().query(\SELECT TOP 1 * FROM Control_Tags_Historico WHERE id_control_tags = \;\);
      console.log('Control_Tags_Historico:', res2.recordset[0]);
    }
  } catch(e) {
    console.log(e);
  }
  process.exit(0);
}
test();

