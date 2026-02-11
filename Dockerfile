# ── Stage 1: Build frontend ────────────────────
FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Build Go binary ──────────────────
FROM golang:1.24-alpine AS backend-build

# CGO is required for go-sqlite3
RUN apk add --no-cache gcc musl-dev

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY main.go ./
COPY internal/ ./internal/

COPY VERSION ./

# Copy built frontend so it gets embedded at the expected path
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

RUN CGO_ENABLED=1 go build -o jaggle-grids \
    -ldflags="-s -w -X main.Version=$(cat VERSION)" main.go

# ── Stage 3: Runtime ──────────────────────────
FROM alpine:3.21

RUN apk add --no-cache ca-certificates

RUN adduser -D -h /app appuser
WORKDIR /app

COPY --from=backend-build /app/jaggle-grids ./
COPY --from=backend-build /app/frontend/dist ./frontend/dist

RUN mkdir -p /app/data && chown appuser:appuser /app/data

USER appuser

ENV GIN_MODE=release
ENV PORT=8080
ENV DB_PATH=/app/data/jaggle_grids.db

EXPOSE 8080

CMD ["./jaggle-grids"]
