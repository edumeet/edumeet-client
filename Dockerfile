FROM node:20-bookworm-slim as builder

WORKDIR /app

COPY . .

RUN yarn install --frozen-lockfile
RUN yarn build

FROM steebchen/nginx-spa:stable

COPY --from=builder /app/build /app

EXPOSE 80

CMD ["nginx"]
