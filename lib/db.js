// Shared PostgreSQL pool for the Next.js API routes (app/api/**).
// DATABASE_URL is set by docker-compose locally, and by the ROUTES sandbox when it
// builds and tests the application against its own disposable database.
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});
