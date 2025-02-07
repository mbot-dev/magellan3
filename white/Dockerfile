FROM node:16 as builder
WORKDIR /app
COPY ./package.json /app/package.json
COPY ./yarn.lock /app/yarn.lock
RUN yarn install
COPY . .
RUN yarn build
FROM nginx:latest
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf
RUN mkdir /usr/share/nginx/html/capture
COPY --from=builder /app/build /usr/share/nginx/html/capture
