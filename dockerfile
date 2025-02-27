
FROM node:22-alpine AS base
RUN apk add --no-cache python3 make g++ openssl postgresql-client
WORKDIR /usr/src/app
COPY package* .
RUN npm install

FROM base AS dev
COPY . .
EXPOSE 8080
CMD ["npm", "run", "dev"]

FROM base AS prod
COPY . .
EXPOSE 8080
CMD npm run build && npm run start
