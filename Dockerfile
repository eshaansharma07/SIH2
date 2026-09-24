# ==============================================================================
# SAAKHSETU DOCKERFILE — Multi-Stage Production Build
# Aligned with Capstone Syllabus: Docker Deep Dive
# ==============================================================================

# Stage 1: Build React 18 Frontend
FROM node:20-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# Stage 2: Production Server Runtime
FROM node:20-alpine AS runner
WORKDIR /app

# Install native dependencies required for better-sqlite3 build
RUN apk add --no-cache python3 make g++

ENV NODE_ENV=production
ENV PORT=5001

# Install server production dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

# Copy server code
COPY server/ ./server/

# Copy built frontend assets to server public directory
COPY --from=client-builder /app/client/dist ./client/dist

# Expose HTTP port
EXPOSE 5001

# Run server
CMD ["node", "server/server.js"]
