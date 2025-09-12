# Build stage.
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage.
FROM node:24-alpine AS production

WORKDIR /app

COPY --from=builder /app/.output ./

ENV NODE_ENV=production
ENV HOST=0.0.0.0

EXPOSE ${PORT:-3000}

CMD ["node", "/app/server/index.mjs"]
