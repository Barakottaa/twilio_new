# Use Node.js 18 Alpine image (supports both AMD64 and ARM64)
FROM --platform=$BUILDPLATFORM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Install build tools needed for better-sqlite3 native bindings
RUN apk add --no-cache libc6-compat sqlite python3 make g++ 
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
# Rebuild better-sqlite3 for the target platform
RUN npm ci --only=production && npm rebuild better-sqlite3

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install SQLite and other required packages for production
RUN apk add --no-cache sqlite curl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create database directory and set permissions
RUN mkdir -p /app/data
RUN chown nextjs:nodejs /app/data

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/auth/me || exit 1

CMD ["node", "server.js"]
