const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration from environment variable
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=disable') ? false : { rejectUnauthorized: false }
});

async function runMigration() {
    console.log('🔌 Connecting to database...');
    const client = await pool.connect();

    try {
        console.log('🔄 Running Phase 1 Foundation migration...\n');

        // Read the migration file
        const migrationPath = path.join(__dirname, 'db/migrations/001_phase1_foundation.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Execute the migration
        await client.query(migrationSQL);

        console.log('✅ Migration 001_phase1_foundation.sql completed successfully!\n');

        // Verify the changes
        console.log('📋 Verifying schema changes...\n');

        // Read verification file
        const verificationPath = path.join(__dirname, 'db/migrations/001_verification.sql');
        const verificationSQL = fs.readFileSync(verificationPath, 'utf8');

        const verifyResult = await client.query(verificationSQL);

        // The verification script returns results in multiple statements, but pg client.query might only return the last one if not using specific mode,
        // or we can manually check columns. 
        // Let's just run a manual check here to be sure for the logs.

        const columnsCheck = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'expenses' 
            AND column_name IN ('receipt_session_id', 'queue_position', 'row_version', 'content_hash');
        `);

        console.log('Expenses table new columns:');
        console.table(columnsCheck.rows);

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
