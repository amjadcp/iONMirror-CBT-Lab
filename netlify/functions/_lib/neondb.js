import { neon } from '@neondatabase/serverless';

/**
 * Helper to get Neon DB SQL client instance.
 * Expects NEON_DATABASE_URL or DATABASE_URL in environment variables.
 */
export function getNeonSql() {
  const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }
  return neon(connectionString);
}
