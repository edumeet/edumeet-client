FROM node:24-bookworm-slim as builder

WORKDIR /app

COPY . .

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
RUN yarn install --immutable
RUN yarn build

FROM steebchen/nginx-spa:stable

COPY --from=builder /app/build /app

EXPOSE 80

CMD ["nginx"]
