# CFS - Comisión de Fiestas de Seno

> Landing page, news management, and reservation catalog for the Festival Commission of Seno.

## Overview

CFS is a web platform that provides:
- **Public landing page** with news feed and product catalog
- **News module** for staff to manage announcements (CRUD)
- **Reservation catalog** for visitors to browse and reserve items (no checkout)
- **Admin panel** for user management (admin role)
- **Control panel** for staff to manage news, catalog, and reservations

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vite + React + TypeScript |
| Backend | Fastify + TypeScript + GraphQL |
| Database | SQLite |
| Types | GraphQL codegen (auto-generated TypeScript) |
| Reverse Proxy | Caddy |

## Architecture

```
cfs/
├── client/              # Vite + React (frontend)
├── server/              # Fastify + GraphQL (backend)
├── packages/
│   └── types/           # Shared TypeScript types
├── database/            # SQLite schema
└── openspec/            # SDD artifacts
```

## Development

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Build for production
pnpm build
```

## Branch Strategy

```
main (protected, no direct pushes)
└── feature/<module-name>

All changes via Pull Request + review.
Commits follow Conventional Commits.
```

## License

Private - Comisión de Fiestas de Seno