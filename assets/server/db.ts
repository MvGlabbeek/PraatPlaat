import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { diagrams, chatMessages } from '@shared/schema';

const connectionString = process.env.VITE_SUPABASE_URL
  ? `postgresql://postgres.0ec90b57d6e95fcbda19832f:${process.env.VITE_SUPABASE_SUPABASE_ANON_KEY}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
  : process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Database connection string not configured');
}

const client = postgres(connectionString);
export const db = drizzle(client);
