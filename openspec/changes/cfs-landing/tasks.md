# Tasks: cfs-landing — CFS Landing & Management Platform

## Phase 1: Project Setup

### 1.1 Create directory structure
- [x] Create `cfs/` root directory
- [x] Create `cfs/client/`, `cfs/server/`, `cfs/database/`, `cfs/packages/types/` subdirectories
- [x] Create `openspec/` subdirectory for SDD artifacts

### 1.2 Initialize client (Vite + React)
- [x] Run `npm create vite@latest client -- --template react-ts`
- [x] Install dependencies: `@apollo/client`, `graphql`, `react-router-dom`
- [x] Install dev dependencies: `@graphql-codegen/cli`, `@graphql-codegen/typescript`
- [x] Configure `codegen.yml` for schema-first types

### 1.3 Initialize server (Fastify + TypeScript)
- [x] Run `npm init -y` in `server/`
- [x] Install dependencies: `fastify`, `@fastify/jwt`, `@graphql-tools/schema`, `mercurius`, `better-sqlite3`, `bcrypt`
- [x] Install dev dependencies: `typescript`, `@types/node`, `tsx`
- [x] Configure `tsconfig.json`

### 1.4 Setup monorepo root
- [x] Create root `package.json` with workspaces
- [x] Add `packages/types` as local workspace

---

## Phase 2: Database

### 2.1 Create schema
- [x] Write `database/schema.sql` with `users`, `news`, `products`, `reservations` tables
- [x] Add proper constraints, indexes, and DEFAULT values

### 2.2 Create seed data
- [x] Write `database/seed.sql` with initial admin user (admin@senacom.com / changeme123)
- [x] Add sample products (6 items for catalog preview)
- [x] Add sample news items

### 2.3 Initialize SQLite
- [x] Create `database/init.ts` script to run schema + seed
- [x] Create `database/migrations.ts` for version tracking

### 2.4 TDD Setup for Server
- [x] Install vitest in server
- [x] Create `server/src/__tests__/` directory
- [x] Create `server/src/__tests__/db/init.test.ts` — test SQLite connection and schema
- [x] Create `server/src/__tests__/db/seed.test.ts` — validate seed data integrity
- [x] Add CI-ready test script to server/package.json

---

## Phase 3: Server Core

### 3.1 Setup Fastify server
- [x] Create `server/src/index.ts` with Fastify instance
- [x] Register `@fastify/jwt` plugin with secret and expiry (24h)
- [x] Configure CORS for seno.didtor.dev only

### 3.2 Database connection
- [x] Create `server/src/db/index.ts` with better-sqlite3 instance
- [x] Export initialized database for use by resolvers

### 3.3 Auth middleware
- [x] Create `server/src/auth/middleware.ts` with role checks
- [x] Create `server/src/plugins/jwt.ts` for fastify-jwt integration

---

## Phase 4: GraphQL Schema & Resolvers

### 4.1 GraphQL schema
- [x] Write `server/src/graphql/schema.ts` with full type definitions (Query, Mutation, types)
- [x] Define DateTime scalar

### 4.2 Query resolvers
- [x] Implement `news`, `newsItem`, `products`, `product` (public)
- [x] Implement `me`, `allNews`, `reservations` (staff+)
- [x] Implement `users` (admin only)

### 4.3 Mutation resolvers
- [x] Implement `login` (public)
- [x] Implement `createReservation` (public)
- [x] Implement `createNews`, `updateNews`, `deleteNews` (staff+)
- [x] Implement `updateReservationStatus` (staff+)
- [x] Implement `createUser`, `deleteUser` (admin only)

### 4.4 Role enforcement
- [x] Add JWT verification to protected resolvers
- [x] Add role checks (ADMIN, STAFF) where required

### 4.5 Run codegen
- [x] Execute codegen to generate `packages/types/generated/graphql.ts`
- [x] Update server and client to use generated types

---

## Phase 5: Client Setup

### 5.1 Vite + React configuration
- [x] Update `vite.config.ts` with proxy to `/api/*` → `localhost:4000`
- [x] Configure Apollo/URQL client with HttpUrl and auth headers

### 5.2 GraphQL client
- [x] Create `client/src/graphql/client.ts` (Ursula client setup)
- [x] Create `client/src/graphql/queries.ts` (all Query fragments)
- [x] Create `client/src/graphql/mutations.ts` (all Mutation fragments)

### 5.3 Auth context
- [x] Create `client/src/context/AuthContext.tsx` with JWT storage
- [x] Create `client/src/hooks/useAuth.ts`
- [x] Implement HttpOnly cookie handling for JWT

### 5.4 Routing
- [x] Setup `react-router-dom` in `client/src/App.tsx`
- [x] Define routes: `/` (Landing), `/catalog`, `/admin`, `/login`

---

## Phase 6: Client Pages & Components

### 6.1 Landing page
- [x] Create `client/src/pages/Landing.tsx`
- [x] Display news feed (newest first) with `NewsCard` components
- [x] Show "No hay noticias todavía" when empty
- [x] Display catalog preview (up to 6 products)

### 6.2 Catalog page
- [x] Create `client/src/pages/Catalog.tsx`
- [x] Display all products with `ProductCard` components
- [x] Product detail view with stock quantity

### 6.3 Reservation form
- [x] Create `client/src/components/ReservationForm.tsx`
- [x] Fields: productId, quantity, name, email, phone, notes
- [x] Validation and error handling

### 6.4 Control panel
- [x] Create `client/src/pages/ControlPanel.tsx`
- [x] Dashboard with stats (news count, pending reservations, product count)
- [x] Recent news list
- [x] Recent reservations list with status filters
- [x] User management section (admin only)

### 6.5 Login form
- [x] Create `client/src/components/LoginForm.tsx`
- [x] Fields: email, password
- [x] Handle JWT response and cookie storage

### 6.6 UI components
- [x] Create `client/src/components/NewsCard.tsx`
- [x] Create `client/src/components/ProductCard.tsx`
- [x] Apply Minimal Dark Luxury styling (dark theme, elegant spacing)

---

## Phase 7: Auth Flow

### 7.1 Login mutation
- [x] Connect `LoginForm` to `login` GraphQL mutation
- [x] Store JWT in HttpOnly cookie on success

### 7.2 Protected routes
- [x] Add auth guard for `/admin` route
- [x] Redirect to `/login` if unauthenticated

### 7.3 Role-based UI
- [x] Show/hide admin-only UI elements based on role
- [x] Conditionally render user management section

### 7.4 Token refresh
- [x] Implement 401 handling for expired tokens
- [x] Redirect to login on token expiration

---

## Phase 8: Caddy Reverse Proxy

### 8.1 Caddyfile configuration
- [x] Write Caddyfile for `seno.didtor.dev`
- [x] Route `/` → `localhost:3000` (client)
- [x] Route `/api/*` → `localhost:4000` (server)
- [x] Enable TLS with Let's Encrypt

### 8.2 Environment
- [x] Create `.env.example` with `JWT_SECRET`, `DATABASE_PATH`
- [x] Document required environment variables

---

## Phase 9: Integration Testing

### 9.1 E2E Test Setup
- [x] Install Playwright: `pnpm add -D @playwright/test`
- [x] Configure `playwright.config.ts`
- [x] Create `e2e/` directory structure
- [x] Setup E2E fixtures (base URL, auth state)

### 9.2 Landing Page E2E Tests
- [x] `e2e/landing.spec.ts`:
  - Visit `/`, verify news feed renders
  - Show "No hay noticias todavía" when empty
  - Display catalog preview (up to 6 products)

### 9.3 Catalog E2E Tests
- [x] `e2e/catalog.spec.ts`:
  - Visit `/catalog` without auth, verify products listed
  - Click on product, verify detail shows stock

### 9.4 Login E2E Tests
- [x] `e2e/login.spec.ts`:
  - POST `login(email, password)`, verify JWT returned and cookie set
  - Failed login shows error message

### 9.5 Reservation E2E Tests
- [x] `e2e/reservation.spec.ts`:
  - Submit reservation form without auth
  - Verify `pending` status returned

### 9.6 News CRUD E2E Tests
- [x] `e2e/news.spec.ts`:
  - Authenticate as staff
  - Create/read/update/delete news

### 9.7 Stock Update E2E Tests
- [x] `e2e/stock.spec.ts`:
  - Confirm reservation, verify product stock decreases
  - Cancel reservation, verify stock restored if was confirmed

### 9.8 Admin E2E Tests
- [x] `e2e/admin.spec.ts`:
  - Login as admin
  - Verify user management visible at `/admin/users`
  - Create new staff user
  - Delete staff user

### 9.9 Protected Routes E2E Tests
- [x] `e2e/auth.spec.ts`:
  - Verify 401 returned for invalid/expired tokens
  - Protected route redirects to login

---

## Critical Fixes: cfs-landing (Issue Resolution)

### Stock Update Logic (FR-032)

- [x] 1. Add stock decrease when confirming reservation
  - Location: `cfs/server/src/graphql/resolvers.ts` — `updateReservationStatus` mutation
  - Logic: `UPDATE products SET stock = stock - ? WHERE id = ?` when status changes to CONFIRMED

- [x] 2. Add stock restoration when cancelling confirmed reservation
  - Location: `cfs/server/src/graphql/resolvers.ts` — `updateReservationStatus` mutation
  - Logic: `UPDATE products SET stock = stock + ? WHERE id = ?` when status changes to CANCELLED and was previously CONFIRMED

- [x] 3. Write tests for stock update logic
  - Location: `cfs/server/src/__tests__/graphql/mutations/reservation-stock.test.ts`
  - Tests: confirming decreases stock, cancelling confirmed restores stock, cancelling pending does NOT restore

### Self-Delete Protection

- [x] 4. Add self-delete prevention in deleteUser mutation
  - Location: `cfs/server/src/graphql/resolvers.ts` — `deleteUser` mutation
  - Logic: Check if user.id === ctx.user.id before deletion

### User Management UI (FR-060, FR-061)

- [x] 5. Implement user list display
  - Location: `cfs/client/src/pages/ControlPanel.tsx`
  - Shows all users with email and role badge

- [x] 6. Implement create user form
  - Location: `cfs/client/src/pages/ControlPanel.tsx`
  - Fields: email, password, role (staff/admin)
  - Uses `createUser` GraphQL mutation

- [x] 7. Implement delete user button with self-delete protection
  - Location: `cfs/client/src/pages/ControlPanel.tsx`
  - Does not show delete button for current user
  - Uses `deleteUser` GraphQL mutation

- [x] 8. Write tests for user management UI
  - Location: `cfs/client/src/__tests__/pages/ControlPanel.test.tsx`
  - Tests: admin sees user management, user list display, create form visible, no delete for self

---

**Status**: success
**Summary**: Task breakdown for CFS Landing platform — 9 phases from project setup through integration testing, covering Fastify + GraphQL + SQLite backend and Vite + React SPA frontend.
**Artifacts**: /home/didac/Seno-Com/openspec/changes/cfs-landing/tasks.md
**Next**: sdd-apply
**Risks**: Scope creep (reservation-only); JWT XSS mitigated by HttpOnly cookies
**Skill Resolution**: fallback-path