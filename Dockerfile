# Multi-stage build for Next.js application
FROM node:20-alpine AS builder

# Install necessary tools for native module compilation (like bcrypt)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY receipt-parser-web/package*.json ./

# Install all dependencies (including devDependencies for TypeScript build)
RUN npm ci

# Copy application source
COPY receipt-parser-web/ ./

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]