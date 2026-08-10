FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++ sqlite-dev
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
RUN apk add --no-cache python3 make g++ sqlite-dev
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE 3001
CMD ["sh", "-c", "node dist/migrate.js && node dist/main.js"]
