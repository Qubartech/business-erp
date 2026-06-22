FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY web/package*.json ./web/
WORKDIR /app/web
RUN npm install --no-audit --no-fund || true
WORKDIR /app
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
