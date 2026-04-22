# Proposal: cfs-landing — CFS Landing & Management Platform

## Intent

Build the web platform for **CFS (Comisión de Fiestas de Seno)** — a public landing page showcasing news, a product catalog with reservation-only e-commerce, and an internal control panel for staff/admin managing news, reservations, and users. The platform establishes the digital presence for the festival commission and replaces manual/whatsapp-based reservation workflows.

---

## Scope

### In Scope
- Public **landing page** displaying news items (most recent first)
- **News module**: CRUD operations for staff/admin
- **Product catalog**: read-only listing with reservation capability (no checkout/payment)
- **Reservations module**: staff can view and create reservations; visitors submit reservation requests
- **Admin panel**: user management (admin only), JWT-protected
- **Control panel**: staff dashboard for news, catalog, and reservation access
- JWT authentication with role-based access control (admin, staff)

### Out of Scope
- Payment processing/checkout flow
- Real-time notifications (email/SMS)
- Mobile native apps
- Multi-language support (Spanish only for v1)
- Order history for end users (reservations are email/whatsapp-based)

---

## Capabilities

### New Capabilities
- `landing-public`: Public homepage with news feed and catalog preview
- `news-crud`: Create, read, update, delete news items (admin + staff)
- `catalog-view`: Browse product catalog with details
- `reservation-create`: Submit reservation requests (public); view/create reservations (staff)
- `auth-jwt`: JWT-based authentication with admin/staff roles
- `admin-users`: User management (admin only)
- `control-panel`: Staff dashboard unifying news, catalog, and reservations

### Modified Capabilities
- None (greenfield project)

---

## Approach

### Architecture
```
cfs/
├── client/              # Vite + React + TypeScript (frontend)
│   ├── src/
│   └── codegen.ts       # GraphQL codegen config
├── server/              # Fastify + TypeScript + GraphQL (backend)
│   ├── src/
│   └── codegen.ts       # GraphQL codegen config
├── database/            # SQLite schema and migrations
├── packages/
│   └── types/           # Shared TypeScript types (generated from GraphQL schema)
└── openspec/            # SDD artifacts
```

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | Vite + React + TypeScript (SPA) |
| Backend | Fastify + TypeScript + GraphQL (Mercurius) |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT (fastify-jwt) with role claims |
| Types | TypeScript end-to-end + GraphQL codegen (auto-generate from schema) |
| Reverse Proxy | Caddy |

### Type Safety Strategy
1. GraphQL schema is the **single source of truth** for types
2. `graphql-codegen` generates:
   - Server-side: TypeScript types for resolvers (input types, output types)
   - Client-side: React hook types, query/mutation typed result
3. Shared types live in `packages/types/` (generated once, used by both)
4. No manual type duplication — schema → codegen → types

### API Design (GraphQL)
- **Queries**: `news`, `newsItem(id)`, `products`, `product(id)`, `reservations`, `me`
- **Mutations**: `createNews`, `updateNews`, `deleteNews`, `createReservation`, `login`, `createUser`

### Auth Flow
1. User logs in via `login` mutation → receives JWT (expires: 24h)
2. JWT contains `{ id, email, role }` claims
3. Role middleware: `admin` (full), `staff` (news + catalog + reservations), unauthenticated (landing + catalog browse + submit reservation)

---

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `client/` | New | Vite+React frontend application |
| `server/` | New | NodeJS+GraphQL API server |
| `database/` | New | SQLite schema, seeds, migrations |
| `openspec/changes/cfs-landing/` | New | This SDD change artifact |

---

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Scope creep from stakeholders expecting full e-commerce | High | Explicitly lock to "reservation only" in all comms; no cart/checkout |
| JWT token storage XSS vulnerability | Medium | HttpOnly cookies + CSRF tokens; never store in localStorage |
| SQLite concurrency limits under load | Low | SQLite is fine for CFS scale; swap to PostgreSQL if needed later |
| Caddy reverse proxy misconfiguration | Medium | Use official Caddy docker image; document config in README |

---

## Rollback Plan

If deployment fails or critical bugs are found:
1. Revert Caddy config to previous state (point to static placeholder page)
2. Database migrations: rollback via SQLite backup file
3. No data loss since SQLite DB is file-based — restore from `database/backups/`
4. CI/CD pipeline pauses until issue is resolved

---

## Dependencies

- **Caddy**: Already running on `seno.didtor.dev` — will add location blocks for `/api` and `/` proxies
- **NodeJS 20+**: Required for server runtime
- **pnpm**: Preferred package manager for monorepo

---

## Branch Strategy

```
main (protected, no direct pushes)
└── feature/cfs-landing (initial development)
    ├── feature/news-module
    ├── feature/catalog-module
    ├── feature/reservations-module
    └── feature/admin-panel
```

### Rules
- **NO direct pushes to `main`** — all changes via PR
- Branch naming: `feature/<module-name>`, `fix/<issue-name>`, etc.
- PRs require at least 1 review before merge
- Commits follow Conventional Commits (feat:, fix:, docs:, etc.)

---

## Success Criteria

- [ ] Landing page loads in <2s on seno.didtor.dev with news feed
- [ ] Staff can log in and manage news (create, edit, delete)
- [ ] Visitors can browse catalog and submit reservation requests
- [ ] Staff can view all reservations and create new ones
- [ ] Admin can create staff users
- [ ] All GraphQL endpoints return correct role-based access (401 for unauthorized)
- [ ] JWT auth flow works correctly (login → protected routes)
- [ ] Caddy proxies correctly to `localhost:3000` (client) and `localhost:4000` (API)

---

## Localization

- **Code, commits, PRs, README**: English
- **Web UI (user-facing)**: Spanish
