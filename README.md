# Jaggle Grids

[![CI](https://github.com/Jaggle-AI-HQ/grids/actions/workflows/ci.yml/badge.svg)](https://github.com/Jaggle-AI-HQ/grids/actions/workflows/ci.yml)
![Version](https://img.shields.io/badge/dynamic/regex?url=https%3A%2F%2Fraw.githubusercontent.com%2FJaggle-AI-HQ%2Fgrids%2Fmain%2FVERSION&search=%5B%5E%5Cs%5D%2B&label=version)

A web-based spreadsheet application powered by [IronCalc](https://www.ironcalc.com/) (WASM). Part of the Jaggle suite of productivity tools.

## Tech Stack

| Layer    | Technology                      |
| -------- | ------------------------------- |
| Frontend | React 19, TypeScript, Vite, MUI |
| Backend  | Go, Gin, GORM                   |
| Database | SQLite                          |
| Engine   | IronCalc (WebAssembly)          |

## Prerequisites

- **Go** 1.24+
- **Node.js** 22+
- **npm** 10+
- **Docker** (for containerised deployment)

## Getting Started

```sh
# Install dependencies
make install

# Start development servers (backend :8080, frontend :5173)
make dev
```

Open <http://localhost:5173> in your browser.

## Environment Variables

Copy the example and adjust as needed:

```sh
cp .env.example .env
```

| Variable      | Default                 | Description            |
| ------------- | ----------------------- | ---------------------- |
| `PORT`        | `8080`                  | Server listen port     |
| `GIN_MODE`    | `debug`                 | Set `release` for prod |
| `DB_PATH`     | `jaggle_grids.db`       | SQLite database path   |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin    |

## Makefile Commands

| Command        | Description                                    |
| -------------- | ---------------------------------------------- |
| `make dev`     | Run backend and frontend in parallel           |
| `make build`   | Production build (frontend bundle + Go binary) |
| `make install` | Install Go and Node dependencies               |
| `make clean`   | Remove build artifacts and database            |

## Production Build

```sh
make build
GIN_MODE=release PORT=8080 ./jaggle-grids
```

The Go server serves the built frontend from `frontend/dist`.

## Docker

Build and run with Docker Compose:

```sh
docker compose up -d --build
```

Or with a custom origin:

```sh
CORS_ORIGIN=https://grids.example.com docker compose up -d --build
```

The SQLite database is persisted in a named volume (`grids-data`).

## Project Structure

```plaintext
grids/
├── main.go                          # Entrypoint: wiring, routes, server
├── internal/
│   ├── domain/
│   │   ├── entities.go              # User, Spreadsheet, Session
│   │   ├── repositories.go         # Repository interfaces
│   │   └── dto.go                   # Request/response types
│   ├── service/
│   │   ├── auth.go                  # Auth business logic
│   │   └── spreadsheet.go          # Spreadsheet business logic
│   ├── handler/
│   │   ├── auth.go                  # HTTP handlers: auth
│   │   └── spreadsheet.go          # HTTP handlers: spreadsheets
│   ├── middleware/
│   │   ├── auth.go                  # Bearer token auth
│   │   └── cors.go                  # CORS middleware
│   └── repository/sqlite/
│       ├── db.go                    # SQLite connection + migrations
│       ├── models.go                # GORM models + mappers
│       ├── user_repo.go
│       ├── session_repo.go
│       └── spreadsheet_repo.go
├── frontend/
│   ├── src/
│   │   ├── App.tsx                  # Router + root component
│   │   ├── components/
│   │   │   └── ProtectedRoute.tsx
│   │   ├── lib/
│   │   │   ├── api.ts               # API client
│   │   │   └── save-manager.ts      # Auto-save with dirty detection
│   │   └── pages/
│   │       ├── LoginPage.tsx
│   │       ├── DashboardPage.tsx
│   │       └── WorkbookPage.tsx
│   └── vite.config.ts
├── Dockerfile
├── docker-compose.yml
├── VERSION
├── CHANGELOG.md
└── Makefile
```

## API Endpoints

### Public

| Method | Route             | Description  |
| ------ | ----------------- | ------------ |
| `GET`  | `/api/health`     | Health check |
| `POST` | `/api/auth/login` | Mock login   |

### Protected (Bearer token)

| Method   | Route                   | Description        |
| -------- | ----------------------- | ------------------ |
| `GET`    | `/api/auth/me`          | Current user       |
| `POST`   | `/api/auth/logout`      | Invalidate session |
| `GET`    | `/api/spreadsheets`     | List spreadsheets  |
| `POST`   | `/api/spreadsheets`     | Create spreadsheet |
| `GET`    | `/api/spreadsheets/:id` | Get spreadsheet    |
| `PATCH`  | `/api/spreadsheets/:id` | Update title/data  |
| `DELETE` | `/api/spreadsheets/:id` | Delete spreadsheet |

## License

[MIT](LICENSE)
