# ---------- Stage 1: deps (node base)
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# ---------- Stage 2: build
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# ensure REACT_APP or NEXT_PUBLIC env vars are set at build-time if needed:
ARG REACT_APP_API_URL
ARG REACT_APP_WS_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_WS_URL=$REACT_APP_WS_URL
RUN npm run build

# ---------- Stage 3: runtime (nginx)
FROM nginx:stable-alpine AS runtime
COPY --from=builder /app/build /usr/share/nginx/html
# Our nginx.conf (placed next to Dockerfile or copied from /config/nginx.conf)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

