# FineGuard MTD — Makefile
# Provides common development and operational tasks.
# Usage: make <target>

.PHONY: help start start-dev build test test-unit test-integration test-e2e \
        lint typecheck migrate seed deploy infra-plan infra-apply worm-configure worm-verify

# ─── Colors ───────────────────────────────────────────────────────────────────
BLUE  := \033[34m
GREEN := \033[32m
RESET := \033[0m

help: ## Show this help
	@echo ""
	@echo "$(BLUE)FineGuard MTD$(RESET)"
	@echo "════════════════════════════════════"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# ─── Development ──────────────────────────────────────────────────────────────

start: ## Start production server
	npm run server

start-dev: ## Start development server with hot reload
	npm run server:watch

build: ## Build frontend for production
	npm run build

# ─── Database ─────────────────────────────────────────────────────────────────

migrate: ## Run database migrations
	npm run db:migrate

seed: ## Seed database with test data
	npm run db:seed

db-studio: ## Open Drizzle Studio (DB GUI)
	npm run db:studio

# ─── Testing ──────────────────────────────────────────────────────────────────

test: test-unit ## Run all tests

test-unit: ## Run unit tests
	npx vitest run tests/unit/ --reporter=verbose

test-integration: ## Run integration tests (requires Postgres + Azurite)
	npx vitest run tests/integration/ --reporter=verbose

test-e2e: ## Run E2E acceptance test (requires running server)
	npx tsx tests/e2e/mtd-submission.test.ts

test-watch: ## Run unit tests in watch mode
	npx vitest tests/unit/

# ─── Code Quality ─────────────────────────────────────────────────────────────

lint: ## Run ESLint
	npm run lint

typecheck: ## TypeScript type check
	npm run type-check

format: ## Format with Prettier
	npx prettier --write "src/**/*.{ts,tsx}" "server/**/*.ts"

# ─── Docker ───────────────────────────────────────────────────────────────────

docker-up: ## Start all services with Docker Compose
	docker-compose up -d --build

docker-down: ## Stop all Docker services
	docker-compose down

docker-logs: ## Stream API server logs
	docker-compose logs -f api

docker-migrate: ## Run migrations inside Docker
	docker-compose run --rm migrate

# ─── Infrastructure ───────────────────────────────────────────────────────────

infra-plan: ## Terraform plan (requires Azure credentials)
	cd infra/terraform && terraform plan

infra-apply: ## Terraform apply (requires Azure credentials)
	cd infra/terraform && terraform apply

infra-destroy: ## Terraform destroy (use with extreme caution!)
	@echo "⚠ This will DESTROY all Azure resources. Are you sure?"
	@read -p "Type 'destroy' to confirm: " confirm && [ "$$confirm" = "destroy" ]
	cd infra/terraform && terraform destroy

worm-configure: ## Configure Azure Blob WORM immutability policy
	@echo "Enter storage account name:" && read account && \
	bash infra/scripts/configure-immutability.sh "$$account"

worm-verify: ## Verify WORM immutability is active
	@echo "Enter storage account name:" && read account && \
	bash infra/scripts/verify-worm.sh "$$account"

# ─── Deployment ───────────────────────────────────────────────────────────────

deploy: build ## Deploy to Azure App Service (requires az login)
	bash deploy-azure.sh

# ─── Documentation ────────────────────────────────────────────────────────────

docs-serve: ## Serve OpenAPI docs with Swagger UI
	npx @stoplight/spectral-cli lint docs/openapi.yaml || true
	@echo "View docs at: https://editor.swagger.io/?url=http://localhost:3000/openapi.yaml"
