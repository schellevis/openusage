FROM node:24-alpine AS build

WORKDIR /app

COPY package.json ./
RUN npm install --no-package-lock

COPY . .
RUN npm run build

FROM nginx:1.29-alpine

ENV OPENUSAGE_API_BASE_URL=""

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/entrypoint.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
