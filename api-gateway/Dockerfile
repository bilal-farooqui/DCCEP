# ─────────────────────────────────────────────
#  Stage 1 – Install dependencies
# ─────────────────────────────────────────────
FROM node:18-alpine AS deps

WORKDIR /app

# Copy only manifest files first for better layer caching
COPY package.json package-lock.json* ./

RUN npm ci --omit=dev

# ─────────────────────────────────────────────
#  Stage 2 – Runtime image
# ─────────────────────────────────────────────
FROM node:18-alpine AS runner

WORKDIR /app

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy installed modules and source
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Remove local .env so Docker Compose injects vars at runtime
RUN rm -f .env

USER appuser

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "gateway.js"]
