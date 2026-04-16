FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
COPY nest-cli.json tsconfig*.json ./
COPY src ./src

RUN npx prisma generate --schema=./prisma/schema.prisma

RUN npx nest build

RUN test -f dist/main.js || (echo "ERROR: dist/main.js not found after nest build" && exit 1)

ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "dist/main"]
