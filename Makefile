.PHONY: dev backend frontend build clean

# Development: run backend and frontend in parallel
dev:
	@echo "Starting Jaggle Grids development servers..."
	@echo "Backend: http://localhost:8080"
	@echo "Frontend: http://localhost:5173"
	@make -j2 backend frontend

backend:
	go run main.go

frontend:
	cd frontend && npm run dev

# Production build
build:
	cd frontend && npm run build
	go build -o jaggle-grids main.go

# Install all dependencies
install:
	go mod tidy
	cd frontend && npm install

clean:
	rm -f jaggle-grids jaggle_grids.db
	rm -rf frontend/dist
