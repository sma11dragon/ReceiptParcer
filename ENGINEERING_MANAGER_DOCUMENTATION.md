# ReceiptAI Engineering Manager Technical Documentation

## Executive Summary

ReceiptAI is a full-stack AI-powered expense tracking application that combines Telegram bot integration with a web-based dashboard. The system uses Next.js 16 for the frontend, PostgreSQL for data storage, and N8N for workflow automation. It supports multi-user environments with dedicated Telegram bots per user and provides real-time expense parsing and analytics.

---

## 1. Project Architecture Overview

### Technology Stack
- **Frontend**: Next.js 16.1.3 (App Router), TypeScript 5.x, React 19.2.3
- **Backend**: Node.js (Next.js API routes), PostgreSQL
- **Authentication**: bcryptjs for password hashing
- **External Services**: Telegram Bot API, Resend Email API, N8N Workflow Automation
- **UI Components**: Lucide React icons, Recharts for data visualization
- **Deployment**: Docker containerization

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Telegram Bot  │───▶│   N8N Webhook   │───▶│   PostgreSQL    │
│   (per user)    │    │   Automation    │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Dashboard │◀───│   Next.js API   │◀───│   AI OCR        │
│   (React SPA)   │    │   Routes        │    │   Processing    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 2. Complete File Structure & Organization

### Root Directory
```
Receipts Parsing/
├── receipt-parser-web/          # Main Next.js application
│   ├── app/                     # Next.js App Router pages
│   │   ├── api/                 # API routes
│   │   │   ├── auth/           # Authentication endpoints
│   │   │   ├── bots/           # Telegram bot management
│   │   │   ├── expenses/       # Expense CRUD operations
│   │   │   ├── metrics/        # Analytics endpoints
│   │   │   └── telegram/       # Telegram-specific endpoints
│   │   ├── dashboard/          # Main dashboard page
│   │   ├── login/              # User authentication
│   │   ├── register/          # User registration
│   │   ├── layout.tsx         # Root layout component
│   │   └── page.tsx           # Landing page
│   ├── components/             # Reusable React components
│   │   ├── LanguageSwitcher.tsx
│   │   └── TelegramDemo.tsx
│   ├── context/               # React context providers
│   │   └── LanguageContext.tsx
│   ├── hooks/                 # Custom React hooks
│   │   └── useMobile.ts
│   ├── lib/                   # Utility libraries
│   │   ├── db.ts             # Database connection
│   │   ├── email.ts          # Email service
│   │   └── translations.ts   # Internationalization
│   ├── db/                    # Database schemas
│   │   └── schema.sql
│   ├── package.json          # Dependencies and scripts
│   ├── tsconfig.json         # TypeScript configuration
│   └── next.config.ts        # Next.js configuration
├── db/                        # Database exports and schemas
├── n8n/                       # N8N workflow files
├── AGENTS.md                  # Development guidelines
└── deploy.sh                  # Deployment script
```

---

## 3. Database Schema & Relationships

### Core Tables

#### `users` - User Management
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    location VARCHAR(100),
    telegram_chat_id BIGINT UNIQUE,
    telegram_user_id BIGINT UNIQUE,
    telegram_bot_username VARCHAR(100),
    telegram_bot_token VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `user_telegram_bots` - Multi-Bot Support
```sql
CREATE TABLE user_telegram_bots (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    bot_token TEXT UNIQUE NOT NULL,
    bot_username TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `expenses` - Expense Records
```sql
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    bot_id INTEGER REFERENCES user_telegram_bots(id),
    chat_id VARCHAR(50), -- Legacy compatibility
    expense_date DATE NOT NULL,
    expense_time TIME,
    vendor VARCHAR(255),
    amount_original DECIMAL(12,2),
    currency VARCHAR(10),
    amount_sgd DECIMAL(12,2),
    category VARCHAR(100),
    location VARCHAR(255),
    payment_method VARCHAR(50),
    comment TEXT,
    receipt_image_url TEXT,
    needs_review BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `verification_tokens` - Email/Bot Verification
```sql
CREATE TABLE verification_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    token VARCHAR(64) UNIQUE NOT NULL,
    type VARCHAR(20) CHECK (type IN ('email', 'telegram_link')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

### Performance Indexes
```sql
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_user_date ON expenses(user_id, expense_date DESC);
CREATE INDEX idx_expenses_user_category ON expenses(user_id, category);
CREATE INDEX idx_users_telegram_user_id ON users(telegram_user_id);
CREATE INDEX idx_verification_tokens ON verification_tokens(token, expires_at);
```

---

## 4. API Endpoints Documentation

### Authentication Endpoints

#### POST /api/auth/login
**Purpose**: User authentication
**Request Body**:
```json
{
    "email": "user@example.com",
    "password": "password123"
}
```
**Response**:
```json
{
    "success": true,
    "message": "Login successful",
    "user": {
        "id": 1,
        "username": "john_doe",
        "email": "user@example.com",
        "location": "Singapore"
    }
}
```

#### POST /api/auth/register
**Purpose**: User registration with optional Telegram bot setup
**Request Body**:
```json
{
    "username": "john_doe",
    "email": "user@example.com",
    "password": "password123",
    "location": "Singapore",
    "telegram_bot_token": "123456:ABC-DEF...",
    "telegram_bot_username": "my_expense_bot"
}
```

### Bot Management Endpoints

#### GET /api/bots?userId=1
**Purpose**: List user's Telegram bots
**Response**:
```json
{
    "success": true,
    "bots": [
        {
            "id": 1,
            "bot_username": "my_expense_bot",
            "is_active": true,
            "created_at": "2024-01-15T10:30:00Z"
        }
    ]
}
```

#### POST /api/bots
**Purpose**: Add new Telegram bot with webhook setup
**Request Body**:
```json
{
    "userId": 1,
    "botToken": "123456:ABC-DEF...",
    "botUsername": "new_expense_bot"
}
```

### Expense Operations

#### GET /api/expenses?userId=1&startDate=2024-01-01&endDate=2024-01-31
**Purpose**: Retrieve expenses with filtering
**Query Parameters**:
- `userId` (required): User ID
- `startDate`: Filter by start date
- `endDate`: Filter by end date
- `botId`: Filter by specific bot
- `category`: Filter by expense category
- `search`: Search in vendor, comment, location
- `sortBy`: Sort column (expense_date, amount_sgd, vendor, category)
- `sortOrder`: ASC or DESC
- `limit`: Pagination limit (default: 50)
- `offset`: Pagination offset (default: 0)

**Response**:
```json
{
    "success": true,
    "expenses": [
        {
            "id": 1,
            "expense_date": "2024-01-15",
            "vendor": "Starbucks",
            "amount_sgd": 5.40,
            "category": "Food & Beverage",
            "location": "Orchard Road",
            "comment": "Morning coffee",
            "receipt_image_url": "https://example.com/receipt1.jpg"
        }
    ]
}
```

### Analytics & Metrics

#### GET /api/metrics?userId=1&period=monthly
**Purpose**: Comprehensive analytics
**Response**:
```json
{
    "success": true,
    "data": {
        "totalSpending": 2459.50,
        "categoryBreakdown": {
            "Food & Beverage": 890.30,
            "Transportation": 456.20,
            "Shopping": 1113.00
        },
        "trends": {
            "monthly": [
                {"month": "2024-01", "amount": 1200.00},
                {"month": "2024-02", "amount": 1259.50}
            ]
        },
        "insights": [
            "Your highest spending category is Shopping",
            "You spent 23% more on Food & Beverage this month"
        ]
    }
}
```

---

## 5. Component Architecture & Data Flow

### React Component Hierarchy
```
app/layout.tsx (Root Layout)
├── Providers (Context Providers)
│   └── LanguageProvider
├── app/page.tsx (Landing Page)
│   ├── Hero Section
│   ├── Features Section
│   └── TelegramDemo Component
└── app/dashboard/page.tsx (Dashboard)
    ├── LanguageSwitcher
    ├── Expense Charts (Recharts)
    └── Analytics Components
```

### Data Flow Patterns

#### User Registration Flow
1. **Frontend**: Registration form validation
2. **API**: Input validation and password hashing
3. **Bot Verification**: Telegram API token validation
4. **Webhook Setup**: N8N endpoint configuration
5. **Database**: User and bot records creation
6. **Response**: Success with webhook status

#### Expense Processing Flow
```
Telegram User → Telegram Bot → N8N Webhook → AI OCR → Database → Web Dashboard
     │              │              │           │          │           │
     │              │              │           │          │           │
  Send Image    Forward Message  Process     Parse      Store     Fetch
   Receipt       to Webhook     Image       Data      Record     Updates
```

#### Analytics Pipeline
1. **Dashboard Request**: Metrics API call with filters
2. **Database Query**: Complex aggregations and joins
3. **Data Processing**: Trend calculations and insights
4. **Visualization**: Recharts component rendering

---

## 6. Dependencies & Environment Configuration

### Core Dependencies (package.json)
```json
{
    "dependencies": {
        "next": "16.1.1",
        "react": "19.2.3",
        "react-dom": "19.2.3",
        "pg": "^8.16.3",
        "bcryptjs": "^3.0.3",
        "resend": "^6.7.0",
        "lucide-react": "^0.562.0",
        "recharts": "^3.7.0"
    },
    "devDependencies": {
        "typescript": "^5",
        "@types/node": "^20",
        "@types/react": "^19",
        "@types/pg": "^8.16.0",
        "eslint": "^9",
        "eslint-config-next": "16.1.1"
    }
}
```

### Environment Variables
```bash
# Database Configuration
DATABASE_URL=postgresql://root:112233_root@100.90.68.68:2665/sma11dragon_DB

# Email Service
RESEND_API_KEY=re_6tZvLTJm_8YGZ3mn1NqxkgqLZ1p7UVg8w
EMAIL_FROM=onboarding@resend.dev

# N8N Integration
N8N_WEBHOOK_URL=https://n8ntest.daeit.com.sg/webhook/telegram-receipts

# Application
NODE_ENV=development
```

### TypeScript Configuration
```json
{
    "compilerOptions": {
        "target": "ES2017",
        "strict": true,
        "jsx": "react-jsx",
        "moduleResolution": "bundler",
        "paths": {
            "@/*": ["./*"]
        }
    }
}
```

---

## 7. Security Implementation

### Authentication Security
- **Password Hashing**: bcryptjs with 10 salt rounds
- **Input Validation**: All API endpoints validate required fields
- **SQL Injection Prevention**: Parameterized queries exclusively
- **User Isolation**: All database queries filtered by user_id

### API Security Patterns
```typescript
// Example of secure API endpoint pattern
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        
        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }
        
        // Parameterized query prevents SQL injection
        const result = await pool.query(
            'SELECT * FROM expenses WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        
        return NextResponse.json({ success: true, expenses: result.rows });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
```

### Data Protection Measures
- No password hashes in API responses
- Secure database connections with SSL in production
- Environment variable usage for sensitive configuration
- User-based data access control

---

## 8. External Service Integrations

### Telegram Bot API Integration
```typescript
// Bot verification during registration
const botVerification = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
const botData = await botVerification.json();

if (!botData.ok) {
    return NextResponse.json({ error: 'Invalid bot token' }, { status: 400 });
}

// Webhook setup
const webhookSetup = await fetch(
    `https://api.telegram.org/bot${botToken}/setWebhook`,
    {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: process.env.N8N_WEBHOOK_URL })
    }
);
```

### Resend Email Service
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: 'Password Reset Request',
    html: `<p>Your OTP code is: ${otp}</p>`
});
```

### N8N Workflow Automation
- **Webhook Endpoint**: `/webhook/telegram-receipts`
- **Processing Steps**:
  1. Receive Telegram message data
  2. Extract user information from chat_id
  3. Process receipt image with AI OCR
  4. Parse and categorize expense data
  5. Store in PostgreSQL database
  6. Send confirmation message to user

---

## 9. Testing Strategy & Quality Assurance

### Current Testing Approach
- **No Formal Test Framework**: Manual testing via development server
- **Database Verification**: Diagnostic scripts for schema validation
- **API Testing**: Browser dev tools and Postman
- **Integration Testing**: End-to-end workflow verification

### Diagnostic Tools
```bash
# Database health checks
node diagnose_db.js          # Comprehensive database diagnosis
node verify_db.js           # Schema verification
node run_migration.js       # Database migration execution

# User data verification
node receipt-parser-web/check_users.js  # User record validation
```

### Testing Opportunities
1. **Unit Tests**: API route testing with Jest
2. **Integration Tests**: Database operation testing
3. **E2E Tests**: Playwright for user workflows
4. **Performance Tests**: Load testing for concurrent users

---

## 10. Deployment & Infrastructure

### Docker Configuration
```bash
# From deploy.sh analysis
docker build -t receipt-parser-web .
docker run -p 3001:3000 \
  -e DATABASE_URL=$DATABASE_URL \
  -e RESEND_API_KEY=$RESEND_API_KEY \
  -e EMAIL_FROM=$EMAIL_FROM \
  -e N8N_WEBHOOK_URL=$N8N_WEBHOOK_URL \
  receipt-parser-web
```

### Database Infrastructure
- **Host**: 100.90.68.68:2665
- **Database**: sma11dragon_DB
- **Connection**: PostgreSQL with connection pooling
- **SSL**: Enabled in production environment

### Build & Deployment Commands
```bash
# Development
npm run dev              # Start development server (localhost:3000)

# Production
npm run build           # Build optimized production bundle
npm run start           # Start production server
npm run lint            # Run ESLint code quality checks

# Type Safety
npx tsc --noEmit        # TypeScript type checking
```

---

## 11. Performance Optimization

### Database Performance
- **Strategic Indexing**: User-based query optimization
- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: Minimal JOIN operations with proper WHERE clauses
- **Pagination**: LIMIT/OFFSET for large datasets

### Frontend Performance
- **Next.js App Router**: Optimal loading and code splitting
- **Component Lazy Loading**: Dynamic imports for large components
- **Responsive Design**: Mobile-first approach with useMobile hook
- **Debounced Operations**: Search and filter input optimization

### Caching Opportunities
- **Redis Implementation**: Frequently accessed data caching
- **API Response Caching**: Analytics endpoint optimization
- **Static Asset Optimization**: Next.js built-in optimization

---

## 12. Monitoring & Maintenance

### Application Monitoring
```typescript
// Error logging pattern
console.error('API Error - Get Expenses:', {
    userId,
    error: error.message,
    timestamp: new Date().toISOString()
});
```

### Database Health Monitoring
- **Diagnostic Scripts**: Regular schema verification
- **Performance Metrics**: Query execution time tracking
- **User Activity Monitoring**: Login and expense tracking patterns

### Webhook Reliability
- **Success/Failure Tracking**: N8N webhook delivery monitoring
- **Bot Status Verification**: Regular Telegram bot connectivity checks
- **Error Recovery**: Automated retry mechanisms for failed processing

---

## 13. Scalability Considerations & Future Roadmap

### Current Limitations
1. **Single Database Instance**: No read replicas for analytics queries
2. **No Caching Layer**: All queries hit database directly
3. **Limited Error Recovery**: Manual intervention required for some failures
4. **No Automated Testing**: Quality assurance relies on manual testing

### Scaling Opportunities

#### Short-term (3-6 months)
1. **Redis Caching Layer**: Cache frequently accessed data
2. **Database Read Replicas**: Separate read database for analytics
3. **Automated Testing Pipeline**: Jest + Playwright implementation
4. **API Rate Limiting**: Prevent abuse and ensure stability

#### Medium-term (6-12 months)
1. **Microservices Architecture**: Separate bot processing service
2. **Advanced AI Integration**: Improved OCR and categorization
3. **Team/Organization Management**: Multi-tenant architecture
4. **Accounting Software Integration**: QuickBooks, Xero APIs

#### Long-term (12+ months)
1. **Mobile Applications**: Native iOS/Android apps
2. **Advanced Analytics**: Machine learning insights
3. **Enterprise Features**: SSO, advanced permissions
4. **Global Expansion**: Multi-currency, multi-language support

### Technical Debt Management
- **Code Quality**: ESLint configuration enforcement
- **Type Safety**: Strict TypeScript compliance
- **Documentation**: Comprehensive API documentation
- **Testing Coverage**: Minimum 80% code coverage target

---

## 14. Development Workflow & Best Practices

### Code Quality Standards
- **ESLint Configuration**: Next.js recommended rules
- **TypeScript Strict Mode**: All files must have proper typing
- **Import Organization**: External imports first, then internal (@/*)
- **Error Handling**: Consistent try/catch patterns with proper logging

### Development Guidelines
```typescript
// Import organization pattern
import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { User } from '@/types/user';

// Component props pattern
interface ComponentProps {
    readonly userId: number;
    readonly children: React.ReactNode;
}

// API route pattern
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // Validation
        // Processing
        // Response
    } catch (error) {
        // Error handling
    }
}
```

### Multi-Language Support
- **Translation Structure**: Nested object organization in `lib/translations.ts`
- **Language Switching**: Context-based state management
- **Persistent Preferences**: localStorage for user language choice
- **Type Safety**: TypeScript interfaces for translation keys

---

## 15. Conclusion & Recommendations

### Project Strengths
1. **Well-Architected**: Clear separation of concerns and modular design
2. **Modern Technology Stack**: Current versions of Next.js, React, and TypeScript
3. **Security-Conscious**: Proper authentication and data protection measures
4. **Scalable Foundation**: Architecture supports future growth and enhancements

### Immediate Action Items
1. **Implement Testing Framework**: Jest + Playwright for comprehensive testing
2. **Add Caching Layer**: Redis for performance optimization
3. **Enhance Monitoring**: Application performance and error tracking
4. **Documentation Updates**: API documentation and deployment guides

### Strategic Recommendations
1. **Microservices Transition**: Consider separating bot processing for scalability
2. **Advanced Analytics**: Machine learning for expense categorization and insights
3. **Mobile Strategy**: Evaluate native app development for enhanced user experience
4. **Enterprise Features**: SSO integration and advanced permission management

ReceiptAI represents a solid foundation for a modern expense tracking solution with clear paths for scaling and enhancement. The architecture supports current business requirements while providing flexibility for future growth and feature expansion.

---

*Last Updated: January 2026*
*Document Version: 1.0*
*Next Review: Quarterly*