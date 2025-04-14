# Step 1: JDK 17 이미지 사용 (빌드 단계)
FROM openjdk:17-jdk-slim AS builder

# Step 2: 작업 디렉토리 생성
WORKDIR /app

# Step 3: Gradle 빌드 파일과 소스 복사
# 캐시 활용을 위해 먼저 Gradle 관련 파일들을 복사합니다.
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .
COPY src src

# Step 4: Gradle 빌드 실행 (테스트 제외)
RUN chmod +x ./gradlew && ./gradlew build -x test

# Step 5: 실행용 이미지 생성 (런타임 단계)
FROM openjdk:17-jdk-slim
WORKDIR /app

# Step 6: 빌드된 JAR 파일 복사 (build/libs 폴더 내의 *.jar 파일)
COPY --from=builder /app/build/libs/*.jar app.jar

# Step 7: 컨테이너 시작 시 실행 명령어 설정
ENTRYPOINT ["java", "-jar", "app.jar"]
