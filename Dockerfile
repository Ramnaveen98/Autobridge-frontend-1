# ---------- Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci

# Copy sources
COPY . .

# Build with API base baked in
ARG VITE_API_BASE
ENV VITE_API_BASE=${VITE_API_BASE}
RUN VITE_API_BASE=${VITE_API_BASE} npm run build

# ---------- Run stage (Nginx) ----------
FROM nginx:alpine
# Listen on Cloud Run's expected port
EXPOSE 8080

# Replace default server with SPA + caching
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static assets
COPY --from=build /app/dist /usr/share/nginx/html

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
