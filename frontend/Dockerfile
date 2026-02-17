FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Frontend build only - used by backend/Dockerfile in multi-stage build
# For individual frontend deployment, uncomment below:
# FROM node:18-alpine
# WORKDIR /app
# RUN npm install -g serve
# COPY --from=build /app/build ./build
# EXPOSE 3000
# CMD ["serve", "-s", "build", "-l", "3000"]
