# 베이스 이미지는 Python 3.8-slim 사용
FROM python:3.8-slim

# 작업 디렉토리 설정
WORKDIR /app

# 의존성 파일 복사 및 설치
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# 전체 소스 복사
COPY . .

# 컨테이너 외부에 노출할 포트
EXPOSE 8083

# uvicorn 실행
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8083"]
