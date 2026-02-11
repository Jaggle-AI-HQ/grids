.PHONY: dev backend frontend build clean

VERSION := $(shell cat VERSION)
LDFLAGS := -ldflags="-s -w -X main.Version=$(VERSION)"

# Development: run backend and frontend in parallel
dev:
	@echo "Starting Jaggle Grids $(VERSION) development servers..."
	@echo "Backend: http://localhost:8080"
	@echo "Frontend: http://localhost:5173"
	@make -j2 backend frontend

backend:
	go run -ldflags="-X main.Version=$(VERSION)" main.go

frontend:
	cd frontend && npm run dev

# Production build
build:
	cd frontend && npm run build
	go build -o jaggle-grids $(LDFLAGS) main.go

# Install all dependencies
install:
	go mod tidy
	cd frontend && npm install

clean:
	rm -f jaggle-grids jaggle_grids.db
	rm -rf frontend/dist
