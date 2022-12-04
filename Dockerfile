FROM node:19-alpine

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm install

COPY . .

EXPOSE 8080
EXPOSE 3000

CMD ["npm", "start"]