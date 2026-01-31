# AGENTS.md

Guidelines for agentic coding agents working in the ReceiptAI codebase.

## Build Commands

```bash
# Development (from receipt-parser-web/)
cd receipt-parser-web
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint
npx tsc --noEmit         # Type checking

# Testing
npm test                 # Run all tests
npm test -- tests/api/auth.test.ts    # Single test file
npm test -- --testNamePattern="Happy Path"  # Tests matching pattern
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run test:api         # API tests only
npm run test:ocr         # OCR tests only
npm run test:bot         # Bot tests only
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:ui      # Playwright UI mode

# Reporting
npm run report:daily     # Daily report generation
npm run report:weekly    # Weekly report generation
npm run report:analyze   # Query log analysis

# Database (from project root)
node run_migration.js    # Run migrations
node diagnose_db.js      # Diagnose issues
node verify_db.js        # Verify schema
node receipt-parser-web/check_users.js  # Check user records
```

## Code Style

### Imports
- External imports first, then internal imports
- Use `@/*` path aliases for internal imports (e.g., `@/lib/db`, `@/context/LanguageContext`)
- Group React imports separately
- Use named imports for utilities: `import { Pool } from 'pg';`

### TypeScript
- Strict mode enabled with proper type annotations
- Use `NextRequest` and `NextResponse` for API routes
- Use `Readonly<>` for React component props
- Export reusable types: `export type Language = 'en' | 'zh';`
- Define interfaces for API request/response bodies

### Database Queries
- Always use parameterized queries: `pool.query(sql, [param1, param2])`
- Never interpolate user input directly into SQL strings
- Use `async/await` with try/catch error handling
- Validate sortBy against allowlists to prevent SQL injection
- Use parameter indexing: `let paramIdx = 2;` then `WHERE col = $${paramIdx++}`
- Use connection pooling via `pg.Pool`
- Release connections in `finally` blocks if using `pool.connect()`

### API Routes
- Extract search params: `const { searchParams } = new URL(request.url);`
- Validate required parameters early with 400 status codes
- Return consistent JSON: `{ success: boolean, data?: any, error?: string }`
- Use appropriate HTTP status codes: 400, 401, 500
- Log errors with context: `console.error('Action Error:', error);`

### React Components
- Use `'use client';` directive for client-side components
- Define custom hooks with `use` prefix: `useLanguage()`, `useMobile()`
- Use React Context for global state (e.g., `LanguageContext`)
- Persist user preferences to localStorage
- Handle context undefined state with proper error messages

### Naming Conventions
- **Files**: kebab-case for utilities (`lib/db.ts`), PascalCase for components (`components/LanguageSwitcher.tsx`)
- **Functions**: camelCase with descriptive names (`handleSetLanguage`, `validateUserInput`)
- **Variables**: camelCase with meaningful names (`paramIdx`, `allowedSortCols`)
- **Constants**: UPPER_SNAKE_CASE for configuration values
- **Database columns**: snake_case (following PostgreSQL conventions)

### Error Handling
- Wrap database operations in try/catch blocks
- Return generic error messages to clients (avoid exposing internal details)
- Log detailed errors for debugging
- Validate inputs before processing
- Never expose password hashes in API responses

### Security
- Use bcryptjs for password hashing and verification
- Implement proper SQL injection prevention
- Validate and sanitize all user inputs
- Use environment variables for sensitive configuration

### Performance
- Use database indexes on frequently queried columns
- Implement pagination with LIMIT/OFFSET parameters
- Use LEFT JOINs sparingly
- Optimize queries with proper WHERE clauses

## Code Organization

- **API routes**: `app/api/[resource]/route.ts` pattern
- **Shared utilities**: `lib/` directory
- **Components**: `components/` directory
- **Context providers**: `context/` directory
- **Database schema**: `db/` directory with migration files
- **Tests**: `tests/` directory with subdirectories by type (api, ocr, bot, e2e)

## Testing Patterns

- Use Jest with ts-jest preset (configured in package.json)
- Test files: `*.test.ts` or `*.spec.ts`
- Use Supertest for API endpoint testing
- Database tests use separate test database with fixtures
- Follow test naming: "Happy Path", "Fix Path", "Edge Path"
- Use beforeEach/afterEach for test isolation
- Mock external services (email, webhooks) in tests

## Environment Variables

Required in `receipt-parser-web/.env.local`:
```
DATABASE_URL=postgresql://user:password@host:port/database
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@receiptai.com
N8N_WEBHOOK_URL=https://n8n.example.com/webhook/receipt
NODE_ENV=development
```

## Multi-Language Support

- Translations stored in `lib/translations.ts` with nested structure
- Use `useLanguage()` hook to access current language translations
- Language state persisted to localStorage
- Support for 'en' and 'zh' languages with TypeScript safety

## Project Structure

- **Root**: Database scripts, n8n workflows, documentation
- **receipt-parser-web/**: Next.js web application
- **skills/**: n8n MCP skills and documentation
- **n8n/**: Workflow JSON exports
- **db/**: Database schema and CSV data

## Configuration Files

- **ESLint**: `receipt-parser-web/eslint.config.mjs` (uses eslint-config-next)
- **TypeScript**: `receipt-parser-web/tsconfig.json` (strict mode, `@/*` paths)
- **Jest**: Configured in `package.json` with ts-jest preset
