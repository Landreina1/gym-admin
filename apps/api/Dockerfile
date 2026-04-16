FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
COPY . .

RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npx nest build

ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "dist/main"]
