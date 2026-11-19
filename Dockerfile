# syntax=docker/dockerfile:1

# ---------- Build: dependencias + bundle del frontend ----------
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Toolchain por si better-sqlite3 no encuentra binario precompilado
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY packages/server/package.json packages/server/
COPY packages/shared/package.json packages/shared/
RUN npm ci

COPY tsconfig.json tsconfig.node.json vite.config.ts index.html ./
COPY public ./public
COPY src ./src
COPY packages ./packages
RUN npm run build

# ---------- Runtime ----------
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/packages ./packages
COPY --from=build /app/dist ./dist
COPY docker/entrypoint.sh docker/init-db.mjs ./docker/
RUN chmod +x docker/entrypoint.sh

# SQLite y fotos subidas: montar volúmenes persistentes en Coolify
VOLUME ["/app/packages/server/data", "/app/packages/server/uploads"]

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker/entrypoint.sh"]
