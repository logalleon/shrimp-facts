import * as mariadb from 'mariadb';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
  acquireTimeout: 30000
});

// Test connection on startup
async function testConnection() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('✅ MariaDB connected successfully');
    return true;
  } catch (err) {
    console.error('❌ MariaDB connection error:', err.message);
    return false;
  } finally {
    if (conn) conn.release();
  }
}

export { pool, testConnection };
