FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests first so Docker can cache npm install separately
# from application source changes.
COPY package.json package-lock.json ./

RUN npm ci --omit=dev

# Copy the runtime files the API needs after dependencies are installed.
COPY . .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "index.js"]
