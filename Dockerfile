FROM oven/bun:1

WORKDIR /app

# Install deps (separate layers for cache efficiency)
COPY package.json bun.lock* ./
COPY server/package.json server/bun.lock* ./server/
COPY client/package.json client/bun.lock* ./client/

RUN bun install --frozen-lockfile && \
    bun install --cwd server --frozen-lockfile && \
    bun install --cwd client --frozen-lockfile

# Copy source and build client
COPY . .
RUN bun run --cwd client build

EXPOSE 3000
ENV NODE_ENV=production
CMD ["bun", "server/src/index.ts"]
