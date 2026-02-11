# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-02-11

### Added

- Custom menu bar with File, Edit, View, Insert, Format, and Data menus
- Format toolbar with font family, font size, bold, italic, underline, strikethrough, text color, fill color, borders, horizontal/vertical alignment, wrap text, number format, insert/delete rows and columns, and clear formatting
- Export spreadsheets as CSV (per-sheet) and XLSX (all sheets) via File menu
- Freeze/unfreeze rows and columns via View menu
- Toggle grid lines via View menu
- Color picker with 80-color palette for text and fill colors
- Number format presets (general, number, currency, percentage, date, time)
- SheetJS (`xlsx`) dependency for XLSX export support

### Fixed

- Spreadsheet title could not be edited due to IronCalc stealing focus on every re-render
- Typing in the title input lost the caret after each keystroke due to IronCalc calling `window.getSelection().empty()` during re-renders
- Title editing now uses click-outside detection instead of `onBlur` to prevent IronCalc's focus management from interfering

### Changed

- Replaced IronCalc's built-in toolbar with custom menu bar and format toolbar
- Memoised the IronCalc component to prevent unnecessary re-renders during title editing
- Workbook container is set to `inert` while editing the title to block IronCalc focus stealing
- Header toolbar z-index elevated to ensure it renders above the spreadsheet area

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

[0.2.0]: https://github.com/Jaggle-AI-HQ/grids/releases/tag/v0.2.0
[0.1.0]: https://github.com/Jaggle-AI-HQ/grids/releases/tag/v0.1.0
