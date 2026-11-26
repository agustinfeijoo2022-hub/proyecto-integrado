FROM node:24-bookworm-slim
WORKDIR /app
COPY ["Sistema de Gestión FYAG/package.json", "Sistema de Gestión FYAG/package-lock.json", "./"]
RUN npm ci --omit=dev
COPY ["Sistema de Gestión FYAG/server/", "./server/"]
ENV NODE_ENV=production
USER node
EXPOSE 3001
CMD ["node", "server/index.js"]
