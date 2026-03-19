import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { diagrams, chatMessages } from '@shared/schema';
import fs from 'fs';
import path from 'path';

let connectionString = process.env.DATABASE_URL ||
  process.env.VITE_SUPABASE_DB_URL ||
  process.env.SUPABASE_DB_URL;

if (!connectionString) {
  try {
    const envPath = path.join(process.cwd(), '../.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/^DATABASE_URL=(.+)$/m);
      if (match) {
        connectionString = match[1].trim();
      }
    }
  } catch (e) {
    // ignore
  }
}

if (!connectionString) {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/^DATABASE_URL=(.+)$/m);
      if (match) {
        connectionString = match[1].trim();
      }
    }
  } catch (e) {
    // ignore
  }
}

if (!connectionString) {
  throw new Error('Database connection string not configured. Set DATABASE_URL environment variable.');
}

const client = postgres(connectionString);
export const db = drizzle(client);
