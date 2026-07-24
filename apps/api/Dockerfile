# Backend NestJS para Cloud Run.
# Multi-stage: compila con la imagen completa (tiene toolchain para bcrypt nativo)
# y corre en la imagen slim con solo dependencias de producción.

FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
# Cloud Run inyecta PORT (8080). main.ts ya lo respeta y escucha en 0.0.0.0.
EXPOSE 8080
CMD ["node", "dist/main"]
