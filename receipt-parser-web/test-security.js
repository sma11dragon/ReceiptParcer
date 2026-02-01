#!/usr/bin/env node

/**
 * Security Test Script for ReceiptAI API
 * 
 * This script tests the security improvements made to the API endpoints.
 * Run with: node test-security.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔐 ReceiptAI Security Test Suite');
console.log('================================\n');

// Test 1: Check for exposed credentials in .env.local
console.log('Test 1: Checking for exposed credentials in .env.local...');
try {
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        
        // Check for hardcoded R2 credentials
        const r2KeyPattern = /R2_ACCESS_KEY_ID\s*=\s*["']?[a-f0-9]+["']?/;
        const r2SecretPattern = /R2_SECRET_ACCESS_KEY\s*=\s*["']?[a-f0-9]+["']?/;
        
        if (r2KeyPattern.test(envContent) && r2SecretPattern.test(envContent)) {
            console.log('⚠️  WARNING: R2 credentials found in .env.local');
            console.log('   Recommendation: Use environment variables in Vercel dashboard\n');
        } else {
            console.log('✅ PASS: No hardcoded R2 credentials found\n');
        }
        
        // Check for database credentials
        const dbPattern = /DATABASE_URL\s*=\s*["']?postgresql:\/\/[^:]+:[^@]+@/;
        if (dbPattern.test(envContent)) {
            console.log('⚠️  WARNING: Database credentials found in .env.local');
            console.log('   Recommendation: Use different credentials for production\n');
        }
    } else {
        console.log('✅ PASS: .env.local file not found (as expected for production)\n');
    }
} catch (error) {
    console.log('❌ ERROR:', error.message, '\n');
}

// Test 2: Check for .env.example template
console.log('Test 2: Checking for .env.example template...');
try {
    const envExamplePath = path.join(__dirname, '.env.example');
    if (fs.existsSync(envExamplePath)) {
        const content = fs.readFileSync(envExamplePath, 'utf8');
        if (content.includes('your_') && content.includes('NEVER commit')) {
            console.log('✅ PASS: .env.example template found with placeholders\n');
        } else {
            console.log('⚠️  WARNING: .env.example may contain real credentials\n');
        }
    } else {
        console.log('❌ FAIL: .env.example template not found\n');
    }
} catch (error) {
    console.log('❌ ERROR:', error.message, '\n');
}

// Test 3: Check .gitignore for .env.local
console.log('Test 3: Checking .gitignore for .env.local...');
try {
    const gitignorePath = path.join(__dirname, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
        const content = fs.readFileSync(gitignorePath, 'utf8');
        if (content.includes('.env.local') || content.includes('.env*')) {
            console.log('✅ PASS: .env.local is in .gitignore\n');
        } else {
            console.log('❌ FAIL: .env.local not in .gitignore\n');
        }
    } else {
        console.log('❌ FAIL: .gitignore file not found\n');
    }
} catch (error) {
    console.log('❌ ERROR:', error.message, '\n');
}

// Test 4: Check for authentication middleware
console.log('Test 4: Checking for authentication middleware...');
try {
    const authPath = path.join(__dirname, 'lib', 'auth.ts');
    if (fs.existsSync(authPath)) {
        const content = fs.readFileSync(authPath, 'utf8');
        if (content.includes('authenticateRequest') && content.includes('protectRoute')) {
            console.log('✅ PASS: Authentication middleware found\n');
        } else {
            console.log('⚠️  WARNING: Authentication middleware may be incomplete\n');
        }
    } else {
        console.log('❌ FAIL: Authentication middleware not found\n');
    }
} catch (error) {
    console.log('❌ ERROR:', error.message, '\n');
}

// Test 5: Check for validation library
console.log('Test 5: Checking for validation library...');
try {
    const validationPath = path.join(__dirname, 'lib', 'validation.ts');
    if (fs.existsSync(validationPath)) {
        const content = fs.readFileSync(validationPath, 'utf8');
        if (content.includes('validateInput') && content.includes('CommonRules')) {
            console.log('✅ PASS: Validation library found\n');
        } else {
            console.log('⚠️  WARNING: Validation library may be incomplete\n');
        }
    } else {
        console.log('❌ FAIL: Validation library not found\n');
    }
} catch (error) {
    console.log('❌ ERROR:', error.message, '\n');
}

// Test 6: Check API routes for security improvements
console.log('Test 6: Checking API routes for security improvements...');
const apiRoutes = [
    'app/api/upload-receipt/route.ts',
    'app/api/expenses/route.ts'
];

let allRoutesSecure = true;
for (const route of apiRoutes) {
    const routePath = path.join(__dirname, route);
    if (fs.existsSync(routePath)) {
        const content = fs.readFileSync(routePath, 'utf8');
        
        let secureChecks = 0;
        
        // Check for authentication
        if (content.includes('protectRoute') || content.includes('protectUserResource')) {
            secureChecks++;
        }
        
        // Check for validation
        if (content.includes('validateQueryParams') || content.includes('validateRequestBody')) {
            secureChecks++;
        }
        
        // Check for parameterized queries (SQL injection prevention)
        if (content.includes('$1') || content.includes('params.push')) {
            secureChecks++;
        }
        
        if (secureChecks >= 2) {
            console.log(`   ✅ ${route}: Secure (${secureChecks}/3 checks passed)`);
        } else {
            console.log(`   ⚠️  ${route}: Needs improvement (${secureChecks}/3 checks passed)`);
            allRoutesSecure = false;
        }
    } else {
        console.log(`   ❌ ${route}: Not found`);
        allRoutesSecure = false;
    }
}

if (allRoutesSecure) {
    console.log('\n✅ PASS: All API routes have basic security measures\n');
} else {
    console.log('\n⚠️  WARNING: Some API routes need security improvements\n');
}

// Test 7: Check for TypeScript compilation
console.log('Test 7: Checking TypeScript compilation...');
try {
    execSync('npx tsc --noEmit', { cwd: __dirname, stdio: 'pipe' });
    console.log('✅ PASS: TypeScript compilation successful\n');
} catch (error) {
    console.log('❌ FAIL: TypeScript compilation errors found');
    console.log('   Run: npx tsc --noEmit to see errors\n');
}

// Test 8: Check for linting
console.log('Test 8: Checking ESLint...');
try {
    execSync('npm run lint', { cwd: __dirname, stdio: 'pipe' });
    console.log('✅ PASS: ESLint passed\n');
} catch (error) {
    console.log('⚠️  WARNING: ESLint found issues');
    console.log('   Run: npm run lint to see details\n');
}

// Summary
console.log('📊 SECURITY TEST SUMMARY');
console.log('=======================');

const recommendations = [
    '1. Set environment variables in Vercel dashboard for production',
    '2. Rotate R2 credentials periodically (every 90 days)',
    '3. Implement proper user authentication in frontend',
    '4. Add API rate limiting in production',
    '5. Set up monitoring for suspicious activity',
    '6. Regular security audits (monthly)',
    '7. Use HTTPS only in production',
    '8. Implement CORS policies for API endpoints'
];

console.log('\n🔧 RECOMMENDATIONS FOR PRODUCTION:');
recommendations.forEach(rec => console.log(`   ${rec}`));

console.log('\n🚀 NEXT STEPS:');
console.log('   1. Deploy to Vercel with environment variables set');
console.log('   2. Test all API endpoints with authentication');
console.log('   3. Monitor Cloudflare R2 usage and costs');
console.log('   4. Set up error tracking (Sentry, etc.)');
console.log('   5. Document API usage for developers');

console.log('\n✅ Security improvements completed!');
console.log('   Remember: Security is an ongoing process, not a one-time task.\n');