FROM node:22-slim

# Chromium потрібен лише для створення PDF.
RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium fonts-dejavu-core \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    BROWSER_PATH=/usr/bin/chromium \
    BROWSER_NO_SANDBOX=1

WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
# devDependencies (vite) потрібні для збірки клієнта.
RUN npm ci --include=dev

COPY . .
RUN npm run build

# PORT видає Railway; дані пишемо в DATA_FILE на змонтованому томі.
CMD ["npm", "start"]
