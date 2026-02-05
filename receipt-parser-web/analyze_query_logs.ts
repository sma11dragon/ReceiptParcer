import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getDatabaseUrl() {
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/DATABASE_URL=(.+)/);
        if (match) return match[1].trim().replace(/^["'](.+)["']$/, '$1');
    }
    return process.env.DATABASE_URL;
}

interface AnalysisOptions {
    silent?: boolean;
    timeInterval?: string;
}

async function runAnalysis(options: AnalysisOptions = {}) {
    const { silent = false, timeInterval = '24 hours' } = options;
    const databaseUrl = await getDatabaseUrl();
    if (!databaseUrl) {
        console.error('DATABASE_URL not found in .env.local or process.env');
        process.exit(1);
    }

    if (!silent) {
        console.log(`Using database URL: ${databaseUrl.replace(/:[^:]*@/, ':****@')}`);
    }
    
    const pool = new Pool({ connectionString: databaseUrl });

    try {
        if (!silent) {
            const intervalText = timeInterval === '24 hours' ? 'Daily' : timeInterval === '7 days' ? 'Weekly' : timeInterval;
            console.log(`\n📊 ${intervalText.toUpperCase()} QUERY LOGS ANALYSIS`);
            console.log('='.repeat(40) + '\n');
        }

        // 1. Overall statistics
        if (!silent) console.log(`1. OVERALL STATISTICS (Last ${timeInterval})`);
        const overallStats = await pool.query(`
            SELECT 
                outcome_type,
                COUNT(*) as query_count,
                ROUND(AVG(result_count) FILTER (WHERE result_count IS NOT NULL), 1) as avg_results,
                ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as percentage
            FROM query_logs
            WHERE timestamp >= NOW() - INTERVAL '${timeInterval}'
            GROUP BY outcome_type
            ORDER BY query_count DESC;
        `);
        if (!silent) console.table(overallStats.rows);

        // 2. Failed queries (empty results)
        if (!silent) console.log(`\n2. EMPTY RESULT QUERIES (Top 10) - Last ${timeInterval}`);
        const emptyQueries = await pool.query(`
            SELECT 
                message_text,
                filters_applied,
                result_count,
                timestamp
            FROM query_logs
            WHERE result_count = 0
                AND timestamp >= NOW() - INTERVAL '${timeInterval}'
                AND message_text IS NOT NULL
            ORDER BY timestamp DESC
            LIMIT 10;
        `);
        if (!silent) {
            if (emptyQueries.rows.length > 0) {
                console.table(emptyQueries.rows.map(row => ({
                    message: row.message_text?.substring(0, 50) + (row.message_text?.length > 50 ? '...' : ''),
                    filters: JSON.stringify(row.filters_applied),
                    results: row.result_count,
                    time: row.timestamp.toISOString().split('T')[0]
                })));
            } else {
                console.log(`No empty result queries in the last ${timeInterval}.`);
            }
        }

        // 3. Common misspellings analysis (simple heuristic)
        if (!silent) console.log('\n3. POTENTIAL MISSPELLINGS (Location names)');
        const knownLocations = [
            'singapore', 'malaysia', 'thailand', 'cambodia', 'indonesia', 'vietnam', 'philippines',
            'japan', 'korea', 'china', 'taiwan', 'hong kong', 'india', 'australia', 'usa', 'united states',
            'united kingdom', 'uk', 'germany', 'france', 'italy', 'spain', 'netherlands', 'switzerland',
            'kuala lumpur', 'petaling jaya', 'puchong', 'johor', 'penang', 'bangkok', 'phnom penh',
            'jakarta', 'manila', 'tokyo', 'seoul', 'shanghai', 'beijing', 'hanoi', 'ho chi minh',
            'sydney', 'melbourne', 'london', 'new york', 'los angeles', 'san francisco'
        ];

        // Get unique message texts from failed queries
        const messages = await pool.query(`
            SELECT DISTINCT LOWER(message_text) as text
            FROM query_logs
            WHERE timestamp >= NOW() - INTERVAL '${timeInterval}'
                AND message_text IS NOT NULL
                AND outcome_type IN ('empty', 'invalid')
            LIMIT 100;
        `);

        // Levenshtein distance function
        function levenshtein(a: string, b: string): number {
            if (a.length === 0) return b.length;
            if (b.length === 0) return a.length;
            
            const matrix: number[][] = [];
            for (let i = 0; i <= b.length; i++) {
                matrix[i] = [i];
            }
            for (let j = 0; j <= a.length; j++) {
                matrix[0][j] = j;
            }
            for (let i = 1; i <= b.length; i++) {
                for (let j = 1; j <= a.length; j++) {
                    const cost = a[j - 1] === b[i - 1] ? 0 : 1;
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j - 1] + cost
                    );
                }
            }
            return matrix[b.length][a.length];
        }

        interface Misspelling {
            original: string;
            suggested: string;
            distance: number;
            full_query: string;
        }

        const potentialMisspellings: Misspelling[] = [];
        for (const row of messages.rows) {
            const text = row.text;
            if (!text) continue;
            
            const words = text.split(/\s+/);
            for (const word of words) {
                if (word.length < 4) continue;
                
                // Check if word already matches a known location (exact or substring)
                const alreadyMatches = knownLocations.some(known => 
                    known === word || known.includes(word) || word.includes(known)
                );
                if (alreadyMatches) continue;
                
                // Find closest known location by Levenshtein distance
                let bestMatch = null;
                let bestDistance = Infinity;
                for (const known of knownLocations) {
                    // Only consider if length difference <= 3
                    if (Math.abs(known.length - word.length) > 3) continue;
                    
                    const distance = levenshtein(word, known);
                    if (distance < bestDistance && distance <= 2) { // Max 2 edits
                        bestDistance = distance;
                        bestMatch = known;
                    }
                }
                
                if (bestMatch) {
                    potentialMisspellings.push({
                        original: word,
                        suggested: bestMatch,
                        distance: bestDistance,
                        full_query: text.substring(0, 80)
                    });
                }
            }
        }

        if (!silent) {
            if (potentialMisspellings.length > 0) {
                console.table(potentialMisspellings.slice(0, 10));
                console.log(`\nFound ${potentialMisspellings.length} potential misspellings.`);
            } else {
                console.log('No obvious misspellings detected.');
            }
        }

        // 4. Filter patterns for empty results
        if (!silent) console.log(`\n4. COMMON FILTERS IN EMPTY RESULTS - Last ${timeInterval}`);
        const filterPatterns = await pool.query(`
            SELECT 
                filters_applied->>'location' as location,
                filters_applied->>'category' as category,
                filters_applied->>'vendor' as vendor,
                COUNT(*) as empty_count
            FROM query_logs
            WHERE result_count = 0
                AND timestamp >= NOW() - INTERVAL '${timeInterval}'
                AND filters_applied IS NOT NULL
            GROUP BY location, category, vendor
            HAVING COUNT(*) >= 2
            ORDER BY empty_count DESC
            LIMIT 10;
        `);
        if (!silent) {
            if (filterPatterns.rows.length > 0) {
                console.table(filterPatterns.rows);
            } else {
                console.log('No recurring filter patterns in empty results.');
            }
        }

        // 5. Success rate over time
        if (!silent) console.log(`\n5. HOURLY SUCCESS RATE (Last ${timeInterval})`);
        const hourlyStats = await pool.query(`
            SELECT 
                DATE_TRUNC('hour', timestamp) as hour,
                COUNT(*) as total_queries,
                SUM(CASE WHEN outcome_type = 'success' THEN 1 ELSE 0 END) as successful,
                SUM(CASE WHEN outcome_type = 'empty' THEN 1 ELSE 0 END) as empty,
                ROUND(100.0 * SUM(CASE WHEN outcome_type = 'success' THEN 1 ELSE 0 END) / COUNT(*), 1) as success_rate
            FROM query_logs
            WHERE timestamp >= NOW() - INTERVAL '${timeInterval}'
            GROUP BY DATE_TRUNC('hour', timestamp)
            ORDER BY hour DESC;
        `);
        if (!silent) {
            console.table(hourlyStats.rows.map(row => ({
                hour: row.hour.toISOString().replace('T', ' ').substring(0, 16),
                total: row.total_queries,
                success: row.successful,
                empty: row.empty,
                success_rate: row.success_rate
            })));
        }

        // 6. Recommendations
        const totalQueries = overallStats.rows.reduce((sum, row) => sum + parseInt(row.query_count), 0);
        const emptyQueriesCount = overallStats.rows.find(row => row.outcome_type === 'empty')?.query_count || 0;
        const invalidQueriesCount = overallStats.rows.find(row => row.outcome_type === 'invalid')?.query_count || 0;
        
        const recommendations = [];
        
        if (emptyQueriesCount > 0) {
            recommendations.push({
                type: 'empty_queries',
                count: emptyQueriesCount,
                percentage: Math.round(emptyQueriesCount/totalQueries*100),
                filters: filterPatterns.rows.map(row => ({
                    location: row.location,
                    category: row.category,
                    vendor: row.vendor,
                    empty_count: row.empty_count
                }))
            });
        }
        
        if (potentialMisspellings.length > 0) {
            const uniqueCorrections: Record<string, string> = {};
            potentialMisspellings.forEach(item => {
                uniqueCorrections[item.original] = item.suggested;
            });
            recommendations.push({
                type: 'misspellings',
                count: potentialMisspellings.length,
                corrections: Object.entries(uniqueCorrections).slice(0, 10).map(([orig, sug]) => ({ original: orig, suggested: sug }))
            });
        }
        
        if (invalidQueriesCount > 0) {
            recommendations.push({
                type: 'invalid_queries',
                count: invalidQueriesCount,
                percentage: Math.round(invalidQueriesCount/totalQueries*100)
            });
        }

        if (!silent) {
            console.log('\n6. RECOMMENDATIONS');
            
            if (emptyQueriesCount > 0) {
                console.log(`• ${emptyQueriesCount} empty result queries (${Math.round(emptyQueriesCount/totalQueries*100)}% of total)`);
                console.log('  Consider adding these filters to the classification logic:');
                filterPatterns.rows.forEach(row => {
                    if (row.location) console.log(`    - Location: "${row.location}"`);
                    if (row.category) console.log(`    - Category: "${row.category}"`);
                    if (row.vendor) console.log(`    - Vendor: "${row.vendor}"`);
                });
            }
            
            if (potentialMisspellings.length > 0) {
                console.log(`• ${potentialMisspellings.length} potential misspellings detected`);
                console.log('  Add to correction dictionary:');
                const uniqueCorrections: Record<string, string> = {};
                potentialMisspellings.forEach(item => {
                    uniqueCorrections[item.original] = item.suggested;
                });
                Object.entries(uniqueCorrections).slice(0, 5).forEach(([orig, sug]) => {
                    console.log(`    - "${orig}" → "${sug}"`);
                });
            }
            
            if (invalidQueriesCount > 0) {
                console.log(`• ${invalidQueriesCount} invalid queries (${Math.round(invalidQueriesCount/totalQueries*100)}% of total)`);
                console.log('  Review invalid query patterns to improve intent classification.');
            }

            console.log('\n📈 ANALYSIS COMPLETE');
        }

        // Return data for programmatic use
        return {
            overallStats: overallStats.rows,
            emptyQueries: emptyQueries.rows,
            potentialMisspellings,
            filterPatterns: filterPatterns.rows,
            hourlyStats: hourlyStats.rows,
            totalQueries,
            emptyQueriesCount,
            invalidQueriesCount,
            recommendations
        };

    } catch (error) {
        console.error('❌ Analysis failed:', (error as Error).message);
        console.error(error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAnalysis();
}

export { runAnalysis };
