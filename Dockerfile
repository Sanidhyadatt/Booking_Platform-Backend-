# Build Stage
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Copy package definitions
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy project files
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src/ ./src/
COPY prisma/ ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Build the NestJS app
RUN npm run build

# Production Stage
FROM node:22-alpine

WORKDIR /usr/src/app

# Copy package definitions and prisma schema
COPY package*.json ./
COPY prisma/ ./prisma/

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built artifacts and Prisma Client from builder
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma/client ./node_modules/@prisma/client

# Expose port
EXPOSE 3000

# Script to run migrations and start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
