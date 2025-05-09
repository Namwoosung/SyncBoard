.PHONY: up-servers up-infra up-clients up-all down-servers down-infra down-clients down-all

# 서버 실행
up-servers:
	docker-compose --profile servers up -d

# 인프라 실행
up-infra:
	docker-compose --profile infra up -d

# 클라이언트 실행
up-clients:
	docker-compose --profile clients up -d

# 전체 실행
up-all:
	docker-compose --profile servers --profile infra --profile clients up -d

# 서버 중지
down-servers:
	docker-compose --profile servers down

# 인프라 중지
down-infra:
	docker-compose --profile infra down

# 클라이언트 중지
down-clients:
	docker-compose --profile clients down

# 전체 중지
down-all:
	docker-compose --profile servers --profile infra --profile clients down

# 로그 보기
logs-servers:
	docker-compose --profile servers logs -f

logs-infra:
	docker-compose --profile infra logs -f

logs-clients:
	docker-compose --profile clients logs -f

# 상태 확인
ps:
	docker-compose ps 