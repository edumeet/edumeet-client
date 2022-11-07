FROM node:18-bullseye-slim as builder

WORKDIR /app

COPY . .

RUN yarn install --frozen-lockfile
RUN yarn add eslint-config-react-app@v6 -D
RUN yarn run build

FROM nginx:stable-alpine

COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]