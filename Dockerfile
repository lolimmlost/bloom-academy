# --- Build stage ---
FROM node:20-slim AS build

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# --- Production stage ---
FROM node:20-slim AS production

WORKDIR /app

# Copy the nitro node-server output (self-contained)
COPY --from=build /app/.output ./.output

# Copy content directory (markdown lessons loaded at runtime)
COPY --from=build /app/content ./content

EXPOSE 3000

ENV PORT=3000
ENV HOST=0.0.0.0
ENV NODE_ENV=production

CMD ["node", ".output/server/index.mjs"]
