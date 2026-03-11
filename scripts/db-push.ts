import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";

// Required for Neon serverless
neonConfig.webSocketConstructor = ws;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  console.log("Connecting to database...");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log("Pushing schema to database...");
  
  // Create tables if they don't exist
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        avatar TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS trips (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        origin_name TEXT NOT NULL,
        origin_lat TEXT NOT NULL,
        origin_lng TEXT NOT NULL,
        origin_radius INTEGER NOT NULL,
        destination_name TEXT NOT NULL,
        destination_lat TEXT NOT NULL,
        destination_lng TEXT NOT NULL,
        destination_radius INTEGER NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP,
        available_seats INTEGER,
        price INTEGER,
        max_price INTEGER,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        trip_id INTEGER,
        content TEXT NOT NULL,
        read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        trip_id1 INTEGER NOT NULL,
        trip_id2 INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
  } catch (error) {
    console.error("Error creating tables:", error);
    throw error;
  }

  console.log("Database schema pushed successfully!");
  await pool.end();
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});