# Base Image
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy Prisma schema first for code generation
COPY prisma ./prisma
RUN npx prisma generate

# Copy source code and build
COPY . .
RUN npm run build

# Production Image
FROM node:20-alpine

WORKDIR /app

# Copy built app and dependencies
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 4000

# Script to run migrations and start the server
CMD npx prisma migrate deploy && node dist/server.js
