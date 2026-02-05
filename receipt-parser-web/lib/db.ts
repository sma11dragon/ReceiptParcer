import { Pool } from 'pg';

// Check if connecting to localhost/127.0.0.1 (NAS deployment)
// In those cases, SSL is typically not configured
const isLocalhost = process.env.DATABASE_URL?.includes('localhost') ||
                    process.env.DATABASE_URL?.includes('127.0.0.1');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Disable SSL for localhost connections (NAS deployment)
    // For cloud deployments (Vercel, etc.), SSL is typically required
    ssl: isLocalhost ? false : undefined,
});

export default pool;
