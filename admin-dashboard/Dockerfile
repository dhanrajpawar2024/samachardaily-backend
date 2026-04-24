FROM node:20-alpine AS builder
WORKDIR /app
ARG VITE_API_URL=http://localhost:3000
ARG VITE_SCRAPER_URL=http://localhost:3007
COPY package*.json ./
RUN npm ci
COPY . .
RUN VITE_API_URL=${VITE_API_URL} VITE_SCRAPER_URL=${VITE_SCRAPER_URL} npm run build

FROM nginx:stable-alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 5000
CMD ["nginx", "-g", "daemon off;"]

