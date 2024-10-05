FROM node:18 AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY prisma ./prisma
COPY . .

RUN npm run build

FROM node:18 AS production

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app .

RUN npm install --omit=dev
RUN npm run seed

EXPOSE 4000

CMD ["dumb-init", "node", "dist/src/main"]
