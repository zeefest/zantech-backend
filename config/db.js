import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false 
  }
});
console.log("Checking DB URL:", process.env.DATABASE_URL); /


if (!process.env.DATABASE_URL) {
  console.error("🔴 ERROR: DATABASE_URL is undefined! Check your .env file.");
}

pool.on('connect', () => console.log('🟢 PostgreSQL Online connected (Neon)'));
pool.on('error', err => console.error('🔴 PG Error:', err));

export default pool;