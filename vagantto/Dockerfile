# Vagantto app image. Builds the Next.js app; at startup it syncs the schema,
# seeds today's menu, then serves on :3000.
FROM node:22-slim

WORKDIR /app

# openssl is required by Prisma's query engine.
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install dependencies first for better layer caching.
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest and build (pages are dynamic, so no DB is needed at build time).
COPY . .
RUN npx prisma generate && npm run build

EXPOSE 3000
CMD ["sh", "./docker-entrypoint.sh"]
