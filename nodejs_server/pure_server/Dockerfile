# 베이스 이미지는 Node.js 경량 이미지 사용
FROM node:20-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json 및 package-lock.json 복사 후 의존성 설치
COPY package*.json ./
RUN npm install --production

# 전체 서버 소스 복사
COPY . .

# 컨테이너 외부에 노출할 포트
EXPOSE 8081

# 서버 실행
CMD ["node", "server.js"]
