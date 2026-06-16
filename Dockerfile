# syntax=docker/dockerfile:1

# ---- deps: install full deps (cached on lockfile) ----
FROM node:22-alpine AS deps
# Next/sharp need glibc compat on alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: compile the standalone server ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* are inlined at BUILD time (frozen into the JS bundle).
# Pass them as --build-arg so the browser bundle holds the right values.
ARG NEXT_PUBLIC_BETTER_AUTH_URL
ARG NEXT_PUBLIC_AUTH_EMAIL_PASSWORD
ARG NEXT_PUBLIC_AUTH_GOOGLE
ENV NEXT_PUBLIC_BETTER_AUTH_URL=$NEXT_PUBLIC_BETTER_AUTH_URL \
    NEXT_PUBLIC_AUTH_EMAIL_PASSWORD=$NEXT_PUBLIC_AUTH_EMAIL_PASSWORD \
    NEXT_PUBLIC_AUTH_GOOGLE=$NEXT_PUBLIC_AUTH_GOOGLE \
    NEXT_TELEMETRY_DISABLED=1

# Placeholder so module-load guards pass during page-data collection.
# Pool connects lazily (first query only), so no real DB is hit at build.
# The real connection string is injected at RUNTIME, not baked in.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build

RUN npm run build

# ---- runner: minimal runtime image ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Standalone output + static assets (server.js does not copy these itself)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Server-only env (DATABASE_URL, BETTER_AUTH_SECRET, S3_*, GOOGLE_*, ...)
# is read at RUNTIME — inject with `docker run --env-file` or `-e`.
CMD ["node", "server.js"]
