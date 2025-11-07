const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'login_db',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONN_LIMIT, 10) || 10,
  queueLimit: 0
});

async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function closePool() {
  await pool.end();
}

module.exports = { pool, query, closePool };