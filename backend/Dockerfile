# ==========================================
# 1. Base Image
# ==========================================
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
RUN npm install -g pnpm@latest

# ==========================================
# 2. Dependencies Stage
# ==========================================
FROM base AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
RUN pnpm install --frozen-lockfile
RUN pnpm prisma generate

# ==========================================
# 3. Builder Stage
# ==========================================
FROM base AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY prisma ./prisma/
COPY src ./src
RUN pnpm build

# ==========================================
# 4. Production Runner Stage
# ==========================================
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copiar dependencias y artefactos compilados
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=dependencies /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY package.json ./

# Script de entrada para sincronización automática de base de datos
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
