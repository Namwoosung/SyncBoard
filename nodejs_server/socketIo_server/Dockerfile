FROM node:14-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Socket.IO 서버의 경우 사용할 포트를 설정
EXPOSE 8082

CMD ["node", "server.js"]
