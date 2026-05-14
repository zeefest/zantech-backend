import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

// Ab hum individual fields ke bajaye connectionString use karenge
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Online hosting (Neon/Render) ke liye yeh lazmi hai
  }
});

pool.on('connect', () => console.log('🟢 PostgreSQL Online connected (Neon)'));
pool.on('error', err => console.error('🔴 PG Error:', err));

export default pool;