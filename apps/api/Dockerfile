FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
COPY . .

RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npx nest build
RUN ls -la /app/dist/ && echo "dist/main.js exists:" && test -f /app/dist/main.js && echo "YES" || echo "NO - build failed to create dist/main.js"

ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "/app/dist/main"]
