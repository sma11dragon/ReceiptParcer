# 🐛 Frontend-Specific Troubleshooting Guide

This guide addresses issues specific to frontend development for the ReceiptAI dashboard. For backend/database issues, refer to the main `TROUBLESHOOTING.md`.

## 🚨 Quick Diagnosis Flow for Frontend Issues

```
Start Here
    ↓
Dev server running? → No → Check npm run dev output
    ↓ Yes
Browser loads page? → No → Check console errors (F12)
    ↓ Yes
Login works? → No → Use test credentials
    ↓ Yes
API calls work? → No → Check network tab
    ↓ Yes
Frontend OK
```

---

## 🔍 Common Frontend Error Messages & Solutions

### Error 1: "npm run dev" fails to start
**Symptoms**: 
- Terminal shows error when running `npm run dev`
- Port 3000 already in use
- TypeScript compilation errors

**Solutions**:

#### Port 3000 already in use:
```bash
# Find process using port 3000
lsof -ti:3000
# Kill it
lsof -ti:3000 | xargs kill -9
# Or use different port
npm run dev -- -p 3001
```

#### TypeScript compilation errors:
```bash
# Check TypeScript errors
npx tsc --noEmit
# Fix linting issues
npm run lint -- --fix
# If persistent, check tsconfig.json
```

#### Node modules corrupted:
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Error 2: "Cannot find module" or import errors
**Symptoms**:
- `Module not found: Can't resolve 'component'`
- Import paths not working
- Missing dependencies

**Solutions**:

#### Check import paths:
```typescript
// Wrong (if using app router)
import Button from '../components/Button'

// Correct for app router
import Button from '@/components/Button'
```

#### Install missing dependencies:
```bash
# Check if package is installed
npm list package-name
# Install if missing
npm install package-name --save
```

#### Update TypeScript paths:
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Error 3: React hydration errors
**Symptoms**:
- "Text content does not match server-rendered HTML"
- React hydration warnings in console
- UI flashing or incorrect rendering

**Solutions**:

#### Use useEffect for browser-only code:
```typescript
import { useEffect, useState } from 'react'

function ClientOnlyComponent() {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  if (!isClient) return null
  
  return <div>Client-only content</div>
}
```

#### Check for Date/Time differences:
```typescript
// Server and client may have different timezones
const now = new Date()
// Use UTC or ISO string for consistency
const dateString = now.toISOString()
```

#### Disable SSR for specific components:
```typescript
import dynamic from 'next/dynamic'

const DynamicChart = dynamic(
  () => import('@/components/Chart'),
  { ssr: false }
)
```

### Error 4: API calls failing
**Symptoms**:
- Network tab shows failed requests
- CORS errors in console
- "Failed to fetch" errors

**Solutions**:

#### Check API endpoint URLs:
```typescript
// Wrong - relative path may not work
fetch('/api/expenses')

// Correct - use full path in client components
fetch(`${window.location.origin}/api/expenses`)
```

#### Handle CORS issues:
```typescript
// Add credentials if needed
fetch('/api/data', {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  }
})
```

#### Check response handling:
```typescript
// Always check response.ok
const response = await fetch('/api/data')
if (!response.ok) {
  throw new Error(`HTTP error! status: ${response.status}`)
}
const data = await response.json()
```

### Error 5: State management issues
**Symptoms**:
- State not updating correctly
- Infinite re-renders
- Stale closures in event handlers

**Solutions**:

#### Use proper dependency arrays:
```typescript
// Wrong - missing dependencies
useEffect(() => {
  fetchData(userId)
}, [])

// Correct - include all dependencies
useEffect(() => {
  fetchData(userId)
}, [userId, fetchData])
```

#### Avoid state updates in render:
```typescript
// Wrong - causes infinite loop
function Component() {
  const [count, setCount] = useState(0)
  setCount(count + 1) // Don't do this!
  
  return <div>{count}</div>
}

// Correct - use useEffect
function Component() {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    setCount(prev => prev + 1)
  }, [])
  
  return <div>{count}</div>
}
```

### Error 6: CSS/ styling issues
**Symptoms**:
- Styles not applying
- CSS modules not working
- Layout broken on mobile

**Solutions**:

#### Check CSS module imports:
```typescript
// Wrong
import './styles.module.css'

// Correct
import styles from './styles.module.css'
// Usage
<div className={styles.container}>
```

#### Verify responsive breakpoints:
```css
/* Check media queries are correct */
@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
}
```

#### Inspect computed styles:
1. Open browser DevTools (F12)
2. Select element
3. Check "Computed" tab
4. Look for overridden styles

### Error 7: Test failures
**Symptoms**:
- `npm test` failing
- Jest configuration issues
- Mocking problems

**Solutions**:

#### Clear test cache:
```bash
npm test -- --clearCache
```

#### Run specific test file:
```bash
npm test -- app/dashboard/page.test.tsx
```

#### Update test mocks:
```typescript
// jest.setup.js or test file
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/dashboard',
}))
```

### Error 8: Performance issues
**Symptoms**:
- Slow page loads
- High memory usage
- Janky animations

**Solutions**:

#### Check bundle size:
```bash
# Analyze bundle
npm run build
# Check .next/analyze/ for reports
```

#### Implement code splitting:
```typescript
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'))
```

#### Optimize images:
```typescript
import Image from 'next/image'

// Instead of:
<img src="/image.jpg" alt="..." />

// Use:
<Image 
  src="/image.jpg" 
  alt="..."
  width={500}
  height={300}
  priority={true} // for above-fold images
/>
```

---

## 🛠️ Debugging Techniques

### 1. Browser DevTools
- **Console**: JavaScript errors and logs
- **Network**: API calls and responses
- **Elements**: HTML structure and CSS
- **Performance**: Page load and runtime performance
- **Application**: Storage, cookies, service workers

### 2. React DevTools
- **Components**: Component tree and props
- **Profiler**: Performance profiling
- **Hooks**: Hook state and dependencies

### 3. Terminal Debugging
```bash
# Verbose Next.js output
npm run dev -- --verbose

# TypeScript check only
npx tsc --noEmit

# ESLint with auto-fix
npm run lint -- --fix

# Check for unused dependencies
npx depcheck
```

### 4. Network Debugging
```typescript
// Add logging to API calls
const response = await fetch('/api/data')
console.log('API Response:', {
  status: response.status,
  ok: response.ok,
  url: response.url
})
const data = await response.json()
console.log('API Data:', data)
```

---

## 📱 Device-Specific Issues

### Mobile Issues
**Problem**: Layout broken on mobile
**Solution**: 
```css
/* Add viewport meta tag */
<meta name="viewport" content="width=device-width, initial-scale=1" />

/* Test with Chrome DevTools device toolbar */
```

**Problem**: Touch events not working
**Solution**:
```typescript
// Use onClick for both mouse and touch
<button onClick={handleClick}>Click me</button>

// Or use React's synthetic events
<div onTouchStart={handleTouchStart}>
```

### Browser Compatibility
**Problem**: Works in Chrome but not Safari
**Solution**:
- Check CSS vendor prefixes
- Test JavaScript features (ES6+ support)
- Verify CORS headers
- Check for Safari-specific bugs

**Problem**: Firefox layout issues
**Solution**:
- Check flexbox/grid implementation differences
- Verify font rendering
- Test form element styling

---

## 🔄 Common Workflows & Fixes

### After pulling latest code:
```bash
# Always run after git pull
npm install
npm run dev
# Check for TypeScript errors
npx tsc --noEmit
```

### Before creating PR:
```bash
# Run full test suite
npm test
# Check linting
npm run lint
# Build to catch errors
npm run build
```

### When seeing weird behavior:
1. Clear browser cache (Ctrl+Shift+R for hard reload)
2. Clear Next.js cache: `rm -rf .next`
3. Restart dev server: `npm run dev`
4. Check console for errors

---

## 🆘 When to Ask for Help

### Try these first:
- [ ] Checked browser console for errors
- [ ] Checked terminal output
- [ ] Searched existing issues
- [ ] Tried solutions in this guide
- [ ] Tested in different browser

### Provide when asking for help:
1. **Error message**: Exact text from console
2. **Steps to reproduce**: What you did to cause the error
3. **Expected behavior**: What should have happened
4. **Screenshots**: Of error and relevant code
5. **Environment**: Browser, OS, Node version

### Who to ask:
- **Frontend issues**: Frontend team lead
- **Design/UI issues**: UX/UI designer
- **API issues**: Backend team lead
- **Build/deploy issues**: DevOps engineer

---

## ✅ Prevention Checklist

### Before starting work:
- [ ] `npm install` completed successfully
- [ ] `npm run dev` starts without errors
- [ ] Can login with test credentials
- [ ] Tests pass: `npm test`

### During development:
- [ ] Console is clear of errors
- [ ] API calls return expected data
- [ ] UI works on mobile and desktop
- [ ] No TypeScript errors

### Before committing:
- [ ] All tests pass
- [ ] No linting errors
- [ ] Code builds successfully
- [ ] UI tested in multiple browsers

---

## 📚 Additional Resources

### Documentation:
- `README.md` - Project overview
- `ONBOARDING.md` - Developer setup
- `FRONTEND_TODO.md` - Task list
- Next.js Docs: https://nextjs.org/docs
- React Docs: https://react.dev

### Tools:
- **Chrome DevTools**: F12
- **React DevTools**: Browser extension
- **VS Code Extensions**: ESLint, Prettier, TypeScript
- **Postman/Insomnia**: API testing

### Testing:
- **Local**: http://localhost:3000
- **Test user**: `test@example.com` / `test123`
- **Production**: https://receipts.daeit.com.sg

---

*Last updated: January 2026*  
*For frontend development team use*