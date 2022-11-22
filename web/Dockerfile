FROM node:16.3.0-alpine

WORKDIR /app

EXPOSE 3000

RUN npm install -g serve

CMD ["serve", "-s", "build", "-l", "3000"]

COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.json ./

RUN npm install

COPY ./public ./public
COPY ./src ./src
COPY ./.env ./

RUN npm run build
