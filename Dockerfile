# Stage 1: Build React client
FROM node:20-alpine AS client-builder
WORKDIR /app
COPY package.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm install --workspace=client
COPY client ./client
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build --workspace=client

# Stage 2: Build Express server
FROM node:20-alpine AS server-builder
WORKDIR /app
COPY package.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm install --workspace=server
COPY server ./server
COPY tsconfig.json ./
RUN npm run build --workspace=server

# Stage 3: Production image
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm install --workspace=server --omit=dev

COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=client-builder /app/client/dist ./client/dist

EXPOSE 3001
CMD ["node", "server/dist/index.js"]
