const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE || 'sker_db',
  user: process.env.PG_USER || 'sker_user',
  password: process.env.PG_PASSWORD || 'sker_pass',
});

console.log('Attempting connection with:', {
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE || 'sker_db',
  user: process.env.PG_USER || 'sker_user',
  password: process.env.PG_PASSWORD ? '***' : 'undefined'
});

pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('Connection failed:', err.message);
  } else {
    console.log('Connection successful:', result.rows[0]);
  }
  pool.end();
});