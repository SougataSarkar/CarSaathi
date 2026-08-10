// Load environment variables
require('dotenv').config();

const { Client } = require('pg');

const dbName = process.env.PGDATABASE || 'car_saathi';

const clientConfig = {
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: 'postgres' // connect to default database to create the new one
};

const client = new Client(clientConfig);

async function run() {
  try {
    await client.connect();
    console.log('Connected to default postgres database.');
    
    // Safely quote the database name for SQL execution
    await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
    console.log(`Database "${dbName}" created successfully.`);
  } catch (err) {
    if (err.code === '42P04') {
      console.log(`Database "${dbName}" already exists.`);
    } else {
      console.error('Failed to create database. Please check your credentials:');
      console.error(err.message);
    }
  } finally {
    await client.end();
  }
}

run();
