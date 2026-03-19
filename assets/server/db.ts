import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { diagrams, chatMessages } from '@shared/schema';

// Get connection string from environment
let connectionString = process.env.DATABASE_URL ||
  process.env.VITE_SUPABASE_DB_URL ||
  process.env.SUPABASE_DB_URL;

// If no connection string, try to read from .env file in parent directory
if (!connectionString && process.env.NODE_ENV !== 'production') {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const envPath = path.join(process.cwd(), '../.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/^DATABASE_URL=(.+)$/m);
      if (match) {
        connectionString = match[1].trim();
      }
    }
  } catch (e) {
    console.warn('Could not read .env file:', e);
  }
}

if (!connectionString) {
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('DATABASE')));
  throw new Error('Database connection string not configured. Set DATABASE_URL environment variable.');
}

const client = postgres(connectionString);
export const db = drizzle(client);
