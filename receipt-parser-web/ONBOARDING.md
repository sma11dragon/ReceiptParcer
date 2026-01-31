# 🚀 ReceiptAI Frontend Developer Onboarding

Welcome to the frontend team! This guide will get you set up in **15 minutes** or less.

## 🎯 Your Role: Frontend Web Dashboard Development

**You will focus on:**
- ✅ Marketing pages (landing, features, pricing)
- ✅ User onboarding flows (registration, login, setup)  
- ✅ Main dashboard UI/UX (expense tracking, analytics)
- ✅ Component library and design system

**You WON'T need to touch:**
- ❌ n8n automation workflows (separate system)
- ❌ PostgreSQL database management
- ❌ Docker deployment configuration
- ❌ Backend API development (already built)

## 📋 Quick Start (5 minutes)

### 1. Get the Code
```bash
git clone https://github.com/sma11dragon/ReceiptParcer
cd ReceiptParcer
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment (Simplified!)
```bash
# Just copy the file - credentials pre-filled for local dev
cp .env.local.example .env.local
# NO editing needed - uses local test database
```

### 4. Run the App
```bash
npm run dev
```

**✅ Done!** Visit: http://localhost:3000

**Test Credentials (auto-created):**
- Email: `test@example.com`
- Password: `test123`

---

## 🏗️ Frontend-Only Architecture

### What You Need to Know
```
           ┌─────────────────┐
           │   Web Dashboard │  ← YOU WORK HERE
           │   (Next.js App) │
           └─────────────────┘
                    │
                    ▼  (API Calls)
           ┌─────────────────┐
           │   Backend API   │  ← Already built & maintained
           │   (Node.js)     │
           └─────────────────┘
                    │
                    ▼
           ┌─────────────────┐
           │   PostgreSQL    │  ← Managed by backend team
           │    Database     │
           └─────────────────┘
```

### Frontend Technology Stack
- **Framework**: Next.js 16.1.1 with App Router
- **UI**: React 19 + TypeScript
- **Styling**: CSS Modules + Zen Glassmorphism design
- **Charts**: Recharts for data visualization
- **Testing**: Jest + React Testing Library + Playwright

---

## 🔧 Frontend Development Workflow

### Making Frontend Changes
1. **Create feature branch**
   ```bash
   git checkout -b feature/marketing-page
   ```

2. **Work on frontend files only**
   - Edit files in `app/` directory
   - Create components in `components/` (if needed)
   - Update styles in CSS modules

3. **Test locally**
   ```bash
   npm run dev
   # Test at http://localhost:3000
   ```

4. **Run frontend tests only**
   ```bash
   npm test           # Component/unit tests
   npm run test:e2e   # End-to-end user flows (optional)
   ```

5. **Commit & create PR**
   ```bash
   git add .
   git commit -m "feat: add marketing landing page"
   git push origin feature/marketing-page
   # Create PR on GitHub
   ```

### Frontend Testing Strategy
```bash
# Run frontend tests (your focus)
npm test

# Optional: End-to-end tests
npm run test:e2e

# Skip these (backend team handles):
# npm run test:api    # API tests
# npm run test:ocr    # OCR tests  
# npm run test:bot    # Bot integration tests
```

---

## 🚀 Deployment Process (Simplified!)

### Frontend Deployment is Automatic!
1. **Merge your PR** to main branch
2. **Backend team handles deployment** automatically
3. **Changes go live** in 5-10 minutes
4. **Verify at**: https://receipts.daeit.com.sg

### No Infrastructure Knowledge Needed
- ✅ No SSH access required
- ✅ No Docker commands to run
- ✅ No database management
- ✅ No server configuration

### What Happens Behind the Scenes
1. Your code is merged via GitHub PR
2. Automated pipeline builds and tests
3. Backend team reviews and deploys
4. You get notified when live

---

## 🐛 Frontend-Specific Issues & Fixes

### Issue: "npm install fails"
**Fix**: Clear cache and retry:
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Issue: "Port 3000 already in use"
**Fix**: Find and kill process:
```bash
# Find process using port 3000
lsof -ti:3000
# Kill it
lsof -ti:3000 | xargs kill -9
# Or use different port
npm run dev -- -p 3001
```

### Issue: "TypeScript errors"
**Fix**: Check and fix types:
```bash
# Check for type errors
npx tsc --noEmit
# Fix linting issues
npm run lint -- --fix
```

### Issue: "Tests failing"
**Fix**: Clear test cache:
```bash
npm test -- --clearCache
# Run specific test
npm test -- app/dashboard/page.test.tsx
```

### Issue: "Can't login locally"
**Fix**: Use test credentials (auto-created):
- Email: `test@example.com`
- Password: `test123`
- No database setup needed!

---

## 📁 Frontend Project Structure

### Files You WILL Work With
```
app/                           # YOUR MAIN WORK AREA
├── page.tsx                   # Landing page (update content)
├── layout.tsx                 # Global layout/navigation
├── dashboard/page.tsx         # MAIN: Dashboard UI
├── login/page.tsx             # Login form
├── register/page.tsx          # Registration flow
├── forgot-password/page.tsx   # Password recovery
└── reset-password/page.tsx    # Password reset

components/                    # (Create if needed)
├── ui/                        # Reusable UI components
├── charts/                    # Data visualization
└── forms/                     # Form components

styles/                        # (Create if needed)
├── globals.css                # Global styles
└── components/                # Component styles
```

### Files You WON'T Need to Touch
```
lib/db.ts                     # Database connection (backend)
deploy.sh                     # Deployment script (backend)
Dockerfile                    # Container config (backend)
verify_schema.js              # Database verification (backend)
run_migration.js              # Database migrations (backend)
tests/api/                    # API tests (backend)
tests/ocr/                    # OCR tests (backend)
tests/bot/                    # Bot tests (backend)
```

### Key Frontend Files
- `app/dashboard/page.tsx` - Main dashboard (priority)
- `app/page.tsx` - Marketing landing page
- `app/login/page.tsx` - Authentication flows
- `app/layout.tsx` - Global UI structure

---

## 🔐 Development Credentials (Simplified!)

### Local Development
```
Test User: test@example.com
Test Password: test123
```

### No Production Credentials Needed!
- ✅ No database passwords required
- ✅ No API keys needed locally
- ✅ No server access credentials
- ✅ Everything works with test data

### If You Need Real Data Access
1. Work with test data locally (auto-provided)
2. For production data testing, request:
   - Temporary test account
   - Limited data access
   - Supervised testing session

---

## 📞 Getting Help

### Frontend Issues Only
1. **Check browser console**: F12 → Console tab
2. **Check terminal logs**: `npm run dev` output
3. **Run tests**: `npm test` for error clues

### When Stuck
1. **Check frontend docs**: `README.md` (frontend section)
2. **Review `FRONTEND_TODO.md`**: For task context
3. **Search codebase**: For similar patterns
4. **Ask team lead**: For frontend-specific help

### Emergency (Frontend Issues)
- UI broken in production
- Critical visual bugs  
- Performance issues affecting users

**Backend/database issues**: Contact backend team lead

---

## 🎯 Your First Week Tasks

### Day 1: Environment Setup
1. ✅ Clone repo and run `npm install`
2. ✅ Start dev server: `npm run dev`
3. ✅ Login with test credentials
4. ✅ Explore dashboard UI
5. ✅ Run tests: `npm test`

### Day 2: Code Exploration
1. Study `app/dashboard/page.tsx` structure
2. Understand authentication flow
3. Review component patterns
4. Examine CSS module usage

### Day 3: First Contribution
1. Fix assigned UI bug (simple)
2. Add minor enhancement
3. Create PR and get it merged
4. Verify changes work

### Day 4-5: Feature Work
1. Work on assigned feature from `FRONTEND_TODO.md`
2. Implement with tests
3. Code review and refinement
4. Prepare for deployment

---

## ✅ Frontend Onboarding Checklist

### Environment Ready
- [ ] App runs at http://localhost:3000
- [ ] Can login with test credentials
- [ ] Dashboard loads with sample data
- [ ] Tests pass: `npm test`

### Knowledge Acquired
- [ ] Understand frontend project structure
- [ ] Know which files to edit
- [ ] Familiar with development workflow
- [ ] Know how to deploy changes

### Ready for Work
- [ ] First PR created and merged
- [ ] Understand team processes
- [ ] Know who to ask for help
- [ ] Confident making frontend changes

---

## 🎉 Welcome to the Frontend Team!

You're now ready to work on the ReceiptAI dashboard. Remember:

1. **Focus on frontend only** - UI, UX, components, styling
2. **Test locally first** - Never push untested code
3. **Ask questions early** - Better to ask than waste time
4. **Small, focused PRs** - One feature/bug per PR
5. **Verify production** - Check your changes work live

**Need help?** Ask your frontend team lead or refer to `FRONTEND_TODO.md` for task guidance.

---
*Last updated: January 2026*  
*For frontend development team use*