# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-11

### Added

- Spreadsheet editor powered by IronCalc (WASM)
- Dashboard with spreadsheet management (create, rename, delete, search)
- Auto-save with dirty detection via model serialisation comparison
- Mock authentication (email + name, Bearer token sessions)
- Go/Gin backend with SQLite storage
- Docker and Docker Compose support for deployment
- GitHub Actions CI pipeline (lint, type check, build, Docker build)
- Health check endpoint (`/api/health`) with version info

[0.1.0]: https://github.com/Jaggle-AI-HQ/grids/releases/tag/v0.1.0
