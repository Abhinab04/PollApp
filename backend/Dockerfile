# Build frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./

RUN npm ci

COPY frontend/ .

RUN npm run build

# Build backend
FROM node:18-alpine

WORKDIR /app/backend

COPY backend/package*.json ./

RUN npm ci --only=production

COPY backend/ .

# Copy frontend build from previous stage
COPY --from=frontend-build /app/frontend/build ../frontend/build

EXPOSE 5000

CMD ["node", "server.js"]
