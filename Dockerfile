## ---------- Builder stage ----------
FROM node:18-alpine AS builder

WORKDIR /app

# Leverage cached deps when only source changes
COPY package*.json ./
# Ensure optional native platform binaries (e.g., Rollup) are installed on Alpine (musl)
RUN npm ci --include=optional

# Copy source and build
COPY . .
RUN npm run build

## ---------- Runtime stage ----------
FROM node:18-alpine AS runtime
WORKDIR /app

# Copy built assets only
COPY --from=builder /app/dist ./dist

# Install a tiny static file server
RUN npm install -g serve@14.2.1

EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
