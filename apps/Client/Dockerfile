FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-workspace.yaml package.json ./
COPY packages/ ./packages/
COPY apps/Client/ ./apps/Client/

RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter client build || pnpm --filter react-example build

FROM nginx:alpine
COPY --from=builder /app/apps/Client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
