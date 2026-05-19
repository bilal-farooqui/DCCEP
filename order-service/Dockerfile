# ─────────────────────────────────────────────
#  Stage 1 – Install dependencies
# ─────────────────────────────────────────────
FROM node:18-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci --omit=dev

# ─────────────────────────────────────────────
#  Stage 2 – Runtime image
# ─────────────────────────────────────────────
FROM node:18-alpine AS runner

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN rm -f .env

USER appuser

EXPOSE 5003

ENV NODE_ENV=production

CMD ["node", "src/index.js"]
