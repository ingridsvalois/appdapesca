FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./

RUN npm install

# Force rebuild - v2
COPY . .

RUN npx prisma generate
RUN npx tsc

EXPOSE 5000

CMD ["npm", "start"]