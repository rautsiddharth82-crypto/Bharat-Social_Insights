FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-workspace.yaml package.json ./
COPY packages/ ./packages/
COPY apps/orchestrator/ ./apps/orchestrator/

# Install all dependencies for the entire workspace
RUN pnpm install --frozen-lockfile=false

# Build shared packages first (in correct dependency order)
RUN pnpm --filter @bsi/types build
RUN pnpm --filter @bsi/i18n build

# Build the orchestrator application
RUN pnpm --filter orchestrator build

EXPOSE 8000

CMD ["node", "apps/orchestrator/dist/main.js"]
