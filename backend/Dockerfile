FROM node:20-bullseye-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/* && npm install

COPY . .
RUN npx prisma generate

EXPOSE 8000

CMD ["node", "src/index.js"]
