# Jaggle Grids

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
├── main.go                     # Entrypoint: routes, CORS, static serving
├── server/
│   ├── database/database.go    # SQLite init + auto-migration
│   ├── handlers/
│   │   ├── auth.go             # Login, logout, current user
│   │   └── spreadsheets.go    # Spreadsheet CRUD
│   ├── middleware/auth.go      # Bearer token auth
│   └── models/models.go       # User, Spreadsheet, Session models
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # Router + protected routes
│   │   ├── lib/
│   │   │   ├── api.ts          # API client
│   │   │   └── save-manager.ts # Auto-save with dirty detection
│   │   └── pages/
│   │       ├── LoginPage.tsx
│   │       ├── DashboardPage.tsx
│   │       └── WorkbookPage.tsx
│   └── vite.config.ts
├── Dockerfile
├── docker-compose.yml
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
