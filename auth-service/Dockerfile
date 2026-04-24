FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy source code
COPY src ./src

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start service
CMD ["node", "src/index.js"]
