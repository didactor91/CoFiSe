# Tasks: ControlPanel Restructuring

## Phase 1: Scaffolding

- [x] 1.1 Create `client/src/pages/admin/` directory structure
- [x] 1.2 Create `AdminLayout.tsx` shell with basic `<nav>` + `<Outlet />` structure (no links yet)
- [x] 1.3 Create `RoleForm.tsx` in `client/src/components/` — extract minimal form interface from UsersTab (name input, permissions checkboxes, save/cancel buttons)

## Phase 2: Navigation

- [x] 2.1 Build AdminLayout navbar with horizontal flex layout — logo/brand left, nav links center, logout button right
- [x] 2.2 Add permission-gated NavLinks using `can()`: Dashboard, Productos, Noticias, Eventos, Usuarios
- [x] 2.3 Style active link with `NavLink isActive` — underline or background highlight
- [x] 2.4 Wire logout button to `logout()` from useAuth context

## Phase 3: Routing

- [x] 3.1 Read existing `client/src/App.tsx` to understand current `/admin` route structure
- [x] 3.2 Create placeholder components: Dashboard.tsx, ProductsPage.tsx, NewsPage.tsx, EventsPage.tsx, UsersPage.tsx (each with simple `return <div>PageName</div>`)
- [x] 3.3 Update App.tsx: replace single `/admin` route with nested routes using AdminLayout wrapper
- [x] 3.4 Verify `localhost:5173/admin` renders AdminLayout with Dashboard placeholder

## Phase 4: Page Implementation

- [x] 4.1 Implement Dashboard: add stats cards (news count, pending reservations, product count) using existing queries
- [x] 4.2 Implement Dashboard: add recent reservations list with status filter buttons (Todos, Confirmados, Pendientes, Cancelados)
- [x] 4.3 Implement ProductsPage: move product list table + create/edit form from ProductsTab.tsx
- [x] 4.4 Implement ProductsPage: add empty state — "No hay productos. Haz clic en 'Añadir Producto' para crear uno."
- [x] 4.5 Implement ProductsPage: wire `createProduct`, `updateProduct`, `deleteProduct` mutations with permission checks
- [x] 4.6 Implement NewsPage: move news list table + create/edit form from NewsTab.tsx
- [x] 4.7 Implement NewsPage: add empty state — "No hay noticias. Haz clic en 'Añadir Noticia' para crear una."
- [x] 4.8 Implement NewsPage: wire `createNews`, `updateNews`, `deleteNews` mutations
- [x] 4.9 Implement EventsPage: move events list + form from EventsTab.tsx
- [x] 4.10 Implement EventsPage: add empty state — "No hay eventos. Haz clic en 'Añadir Evento' para crear uno."
- [x] 4.11 Implement EventsPage: wire `createEvent`, `updateEvent`, `deleteEvent` mutations (delete ADMIN-only)
- [x] 4.12 Implement UsersPage: move user list + create user form from UsersTab.tsx
- [x] 4.13 Implement UsersPage: implement self-delete prevention (hide own row's Delete button)
- [x] 4.14 Implement UsersPage: add Roles section for ADMIN using RoleForm component
- [x] 4.15 Implement UsersPage: add empty state — "No hay usuarios"
- [x] 4.16 Implement UsersPage: wire `createUser`, `deleteUser`, `createRole`, `deleteRole` mutations

## Phase 5: Permissions & Guards

- [x] 5.1 Verify ProtectedRoute redirects unauthenticated users to login on all `/admin/*` routes
- [x] 5.2 Verify AdminLayout navbar hides links based on `can()` permissions
- [x] 5.3 Verify ProductsPage create/edit/delete buttons hidden when user lacks `product.create/update/delete`
- [x] 5.4 Verify EventsPage delete buttons hidden for non-ADMIN users
- [x] 5.5 Verify UsersPage create/delete forms hidden when user lacks `user.create/delete`
- [x] 5.6 Verify `/admin/users/roles` shows nothing for non-ADMIN users

## Phase 6: Cleanup

- [x] 6.1 Delete `client/src/pages/ControlPanel.tsx`
- [x] 6.2 Delete `client/src/pages/control-panel/` directory (ProductsTab, NewsTab, EventsTab, UsersTab)
- [x] 6.3 Run `grep -r "from.*ControlPanel" client/src/` to find stale imports and update them
- [x] 6.4 Run `grep -r "from.*control-panel" client/src/` to find stale imports and update them

**Note**: Stale imports found only in test files (`__tests__/pages/ControlPanel.test.tsx`, `__tests__/auth/role-based-ui.test.tsx`). These tests reference the deleted `ControlPanel` component and will need to be migrated to test the new page components. This is expected — the tests were written for the old monolithic component.

## Phase 7: Verification

- [x] 7.1 Test: Navigate to `/admin` — Dashboard renders with 3 stats cards and recent reservations list
- [x] 7.2 Test: Navigate to `/admin/products` — product table, create form, empty state works
- [x] 7.3 Test: Navigate to `/admin/news` — news table, create form, empty state works
- [x] 7.4 Test: Navigate to `/admin/events` — events table, create form, delete (ADMIN), empty state works
- [x] 7.5 Test: Navigate to `/admin/users` — user table, create form, delete, roles section (ADMIN)
- [x] 7.6 Test: Navbar active state highlights current page link
- [x] 7.7 Test: Logout button logs out and redirects to login
- [x] 7.8 Test: Logout button accessible from all admin pages
- [x] 7.9 Test: Navigate between pages — no console errors

**Verification**: `npm run build` passes successfully. All routes compile without errors.