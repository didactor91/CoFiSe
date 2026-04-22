# Design: cfs-landing — CFS Landing & Management Platform

## 1. Technical Approach

The architecture follows a **monorepo with clear separation** between client (Vite + React SPA) and server (Fastify + GraphQL/Mercurius). SQLite provides persistence via better-sqlite3 with synchronous access patterns. JWT auth uses fastify-jwt with role claims embedded in the token payload. GraphQL codegen generates shared TypeScript types from the schema, eliminating manual type duplication.

```
cfs/
├── client/              # Vite + React SPA
├── server/              # Fastify + Mercurius GraphQL
├── database/            # SQLite schema + seeds
├── packages/
│   └── types/          # Shared types (codegen output)
└── openspec/           # SDD artifacts
```

## 2. Architecture Decisions

| Decision | Options Considered | Tradeoff | Decision |
|----------|-------------------|----------|----------|
| **GraphQL Library** | Apollo Server vs Mercurius | Mercurius integrates natively with Fastify, less boilerplate | Mercurius |
| **Auth Strategy** | Sessions vs JWT Bearer | JWT is stateless, scales horizontally, no session storage needed | JWT with fastify-jwt |
| **Token Storage** | localStorage vs HttpOnly cookie | HttpOnly prevents XSS; pair with CSRF token for defense-in-depth | HttpOnly cookie + CSRF |
| **Codegen Flow** | Schema → types (single pass) | GraphQL schema is source of truth; codegen generates both server and client types | Schema-first codegen |
| **SQLite Setup** | better-sqlite3 vs sql.js | better-sqlite3 is synchronous, simpler for Fastify single-thread; sql.js is async but heavier | better-sqlite3 |
| **Folder Structure** | Feature-based vs Layer-based | Layer-based (src/graphql, src/db) is simpler for small team; feature-based adds complexity | Layer-based |

## 3. Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER (React SPA)                          │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ HTTP + Authorization header
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CADDY REVERSE PROXY (seno.didtor.dev)                               │
│  ├── / → localhost:3000 (client)                                    │
│  └── /api/* → localhost:4000 (server)                              │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  FASTIFY SERVER (localhost:4000)                                     │
│  ├── fastify-jwt middleware (verifies Bearer token)                  │
│  ├── Mercurius GraphQL endpoint (/graphql)                          │
│  └── Role middleware (extracts {id, email, role} from JWT)          │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ GRAPHQL RESOLVERS                                                ││
│  │ ├── Query: news, products, me, reservations, users              ││
│  │ └── Mutation: login, createNews, createReservation, createUser ││
│  └─────────────────────────────────────────────────────────────────┘│
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ SQLite via better-sqlite3                                        ││
│  │ ├── users (id, email, password_hash, role)                       ││
│  │ ├── news (id, title, content, image_url, timestamps)            ││
│  │ ├── products (id, name, description, price, stock, timestamps)   ││
│  │ └── reservations (id, product_id, customer info, status)       ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

## 4. File Changes

### Client (`client/src/`)
- `main.tsx` — Vite entry point
- `App.tsx` — Router + context providers
- `graphql/` — `client.ts` (Ursula client), `queries.ts`, `mutations.ts`
- `pages/` — `Landing.tsx`, `Catalog.tsx`, `ControlPanel.tsx`
- `components/` — `NewsCard.tsx`, `ProductCard.tsx`, `ReservationForm.tsx`, `LoginForm.tsx`
- `context/` — `AuthContext.tsx`
- `hooks/` — `useAuth.ts`, `useGraphQL.ts`

### Server (`server/src/`)
- `index.ts` — Fastify server setup, plugin registration
- `graphql/` — `schema.ts` (type definitions), `resolvers.ts`
- `auth/` — `jwt.ts` (sign/verify), `middleware.ts` (role checks)
- `db/` — `index.ts` (better-sqlite3 instance), `migrations.ts`
- `plugins/` — `jwt.ts` (fastify-jwt plugin)

### Database (`database/`)
- `schema.sql` — CREATE TABLE statements
- `seed.sql` — Initial admin user, sample products

### Packages (`packages/types/`)
- `generated/` — `graphql.ts` (codegen output)

## 5. Interfaces / Contracts

**GraphQL Schema** (source of truth in `server/src/graphql/schema.ts`):

```graphql
type Query {
  news: [News!]!                           # Public
  newsItem(id: ID!): News                   # Public
  products: [Product!]!                     # Public
  product(id: ID!): Product                 # Public
  me: User                                  # Authenticated
  allNews: [News!]!                         # Staff+
  reservations(status: ReservationStatus): [Reservation!]!  # Staff+
  users: [User!]!                           # Admin only
}

type Mutation {
  login(email: String!, password: String!): AuthPayload!     # Public
  createReservation(input: CreateReservationInput!): Reservation!  # Public
  createNews(input: CreateNewsInput!): News!        # Staff+
  updateNews(id: ID!, input: UpdateNewsInput!): News!  # Staff+
  deleteNews(id: ID!): Boolean!                  # Staff+
  updateReservationStatus(id: ID!, status: ReservationStatus!): Reservation!  # Staff+
  createUser(input: CreateUserInput!): User!      # Admin
  deleteUser(id: ID!): Boolean!                  # Admin
}
```

**Role Enforcement**:
- JWT payload: `{ id: number, email: string, role: "ADMIN" | "STAFF" }`
- Middleware throws 401 for missing/invalid token
- Resolvers check `role` from context before executing

## 6. Testing Strategy

No test runner detected. **Manual testing checklist**:

| Feature | Test Steps | Expected Result |
|---------|-----------|-----------------|
| Landing | Visit `/` | News feed displayed, "No hay noticias" if empty |
| Login | POST `login(email, password)` | JWT returned, cookie set |
| News CRUD | Auth as staff, create/read/update/delete | Operations succeed |
| Catalog | Visit `/catalog` without auth | Products listed, no auth required |
| Reservation | Submit form without auth | Reservation created with `pending` status |
| Stock update | Confirm reservation | Product stock decreases |
| Admin | Login as admin, access `/admin/users` | User management visible |

## 7. Migration / Rollout

**Greenfield project** — no migration required.

1. Create `cfs/` directory structure
2. Initialize `client/` with Vite + React + TypeScript
3. Initialize `server/` with Fastify + Mercurius + TypeScript
4. Run codegen to generate `packages/types/`
5. Create SQLite DB via `schema.sql`
6. Seed initial admin user (admin@senacom.com / changeme123)
7. Configure Caddy proxy rules
8. Deploy and verify

## 8. Open Questions

| Question | Options | Recommendation |
|----------|---------|----------------|
| CSRF protection | Double Submit Cookie vs Synchronizer Token | Implement same-site cookie + double-submit for simplicity |
| Initial admin account | Seed in DB or CLI script | Seed in `seed.sql` with changeme password, force change on first login |
| CORS configuration | Allow seno.didtor.dev only vs allow all | Allow only seno.didtor.dev origins |
| GraphQL IDE | Expose GraphQL Playground in dev only | Enable in development, disable in production |

---

**Status**: success
**Summary**: Technical design for CFS Landing platform — Fastify + GraphQL + SQLite monorepo with JWT auth, role-based access, and codegen-driven type safety.
**Artifacts**: /home/didac/Seno-Com/openspec/changes/cfs-landing/design.md
**Next**: sdd-tasks
**Risks**: Scope creep (reservation-only, no payments); JWT XSS (mitigated by HttpOnly cookies)
**Skill Resolution**: fallback-path