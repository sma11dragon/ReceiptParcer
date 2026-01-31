const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function getDatabaseUrl() {
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/DATABASE_URL=(.+)/);
        if (match) return match[1].trim().replace(/^["'](.+)["']$/, '$1');
    }
    return process.env.DATABASE_URL;
}

async function runMigration() {
    const databaseUrl = await getDatabaseUrl();
    if (!databaseUrl) {
        console.error('DATABASE_URL not found in .env.local or process.env');
        process.exit(1);
    }

    console.log(`Using database URL: ${databaseUrl.replace(/:[^:]*@/, ':****@')}`);
    
    const pool = new Pool({ connectionString: databaseUrl });
    const client = await pool.connect();

    try {
        console.log('🔄 Running query_logs table migration...\n');

        // Read the migration file
        const migrationPath = path.join(__dirname, 'db', 'migration_add_query_logs.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Execute the migration
        await client.query(migrationSQL);

        console.log('✅ query_logs migration completed successfully!\n');

        // Verify the changes
        console.log('📋 Verifying query_logs table...\n');
        const verifyResult = await client.query(`
            SELECT 
                table_name,
                pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as total_size,
                (SELECT count(*) FROM query_logs) as row_count
            FROM information_schema.tables 
            WHERE table_name = 'query_logs';
        `);

        console.log('query_logs table status:');
        console.table(verifyResult.rows);

        // Show table structure
        const structureResult = await client.query(`
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_name = 'query_logs'
            ORDER BY ordinal_position;
        `);

        console.log('\nquery_logs table structure:');
        console.table(structureResult.rows);

        // Show indexes
        const indexResult = await client.query(`
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'query_logs'
            ORDER BY indexname;
        `);

        console.log('\nquery_logs indexes:');
        console.table(indexResult.rows);

        // Show sample data (if any)
        const sampleResult = await client.query(`
            SELECT 
                id,
                timestamp,
                chat_id,
                outcome_type,
                result_count,
                LENGTH(message_text) as message_length
            FROM query_logs
            ORDER BY timestamp DESC
            LIMIT 5;
        `);

        if (sampleResult.rows.length > 0) {
            console.log('\n📊 Recent query logs (sample):');
            console.table(sampleResult.rows);
        } else {
            console.log('\n📭 No query logs yet (table is empty)');
        }

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