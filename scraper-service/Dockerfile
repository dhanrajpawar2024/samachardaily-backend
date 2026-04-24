FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY src/ ./src/

# Non-root user
RUN addgroup -S scraper && adduser -S scraper -G scraper
USER scraper

EXPOSE 3006

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3006/health || exit 1

CMD ["node", "src/index.js"]

