import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const dbHost = process.env.DB_HOST!;
const dbPort = parseInt(process.env.DB_PORT!, 10);
const dbUser = process.env.DB_USER!;
const dbPassword = process.env.DB_PASSWORD!;
const dbDatabase = process.env.DB_DATABASE_NAME!;

// Connect to default database to create the target database if not exists
const pool = new Pool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  port: dbPort,
  database: 'postgres', // Default DB
});

export async function initializeDatabase() {
  let client;
  try {
    client = await pool.connect();
    const res = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbDatabase],
    );
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbDatabase}"`);
      console.log(`Database ${dbDatabase} created.`);
    } else {
      console.log(`Database ${dbDatabase} already exists.`);
    }
  } catch (err) {
    console.error('Error ensuring database:', err);
    throw err;
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function closePostgresPool() {
  try {
    await pool.end();
    console.log('Postgres utility pool closed successfully.');
  } catch (err) {
    console.error('Error closing Postgres utility pool:', err);
  }
}
