FROM node:24.22.3-alpine AS build
WORKDIR /workspace
COPY package.json package-lock.json ./
RUN HUSKY=0 npm ci
COPY angular.json tsconfig.json tsconfig.app.json .postcssrc.json ./
COPY src ./src
COPY public ./public
RUN npm run build

FROM nginx:stable-alpine
COPY deployment/nginx.docker.conf /etc/nginx/nginx.conf
COPY deployment/api-proxy.conf /etc/nginx/api-proxy.conf
COPY --from=build /workspace/dist/flower-details-frontend/browser /usr/share/nginx/html
USER nginx
EXPOSE 8081
ENTRYPOINT ["nginx", "-g", "daemon off;"]
