FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]