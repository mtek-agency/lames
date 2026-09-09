# syntax=docker/dockerfile:1

ARG NODE_VERSION=22-alpine

# ---------------------------------------------------------------------------
# base: common pnpm setup, shared by every stage below
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS base
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# ---------------------------------------------------------------------------
# deps: full install (deps + devDeps), cached via the pnpm store
# ---------------------------------------------------------------------------
FROM base AS deps
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# dev: hot-reload dev server, source mounted at runtime by docker-compose
# ---------------------------------------------------------------------------
FROM deps AS dev
ENV NODE_ENV=development
COPY . .
EXPOSE 3000
CMD ["pnpm", "run", "dev", "--host", "0.0.0.0"]

# ---------------------------------------------------------------------------
# build: produce the standalone Nitro output (.output)
# ---------------------------------------------------------------------------
FROM deps AS build
ENV NODE_ENV=production
COPY . .
RUN pnpm run build

# ---------------------------------------------------------------------------
# prod: minimal runtime image, no pnpm/build tooling, no source
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS prod
WORKDIR /app
ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000
COPY --from=build /app/.output ./.output
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
