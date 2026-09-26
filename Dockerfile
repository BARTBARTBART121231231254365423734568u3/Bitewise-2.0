# BITEWISE 2.0 — single-service Railway image (API serveert Web-dist)
FROM node:22.23.2-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable || npm i -g pnpm@9.12.0 --prefix /usr/local
WORKDIR /app

FROM base AS build
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY packages/domain/package.json packages/domain/
COPY packages/ui/package.json packages/ui/
RUN pnpm install --frozen-lockfile || pnpm install --no-frozen-lockfile
COPY . .
RUN pnpm build

FROM base AS runtime
ENV NODE_ENV=production
ENV COOKIE_SECURE=1
COPY --from=build /app /app
WORKDIR /app
EXPOSE 3001
CMD ["pnpm", "--filter", "@bitewise/api", "start"]
