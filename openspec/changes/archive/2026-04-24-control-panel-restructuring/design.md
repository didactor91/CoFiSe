# Design: ControlPanel Restructuring

## Technical Approach

Transform the monolithic ~2500-line `ControlPanel.tsx` into page-based structure with horizontal navbar using React Router nested routes. Each management section (Products, News, Events, Users) becomes a standalone page under `/admin/*`, with shared `AdminLayout` wrapper providing navigation and logout.

## Architecture Decisions

### Decision: AdminLayout component structure

**Choice**: Single `AdminLayout` component with horizontal navbar + `Outlet` for page content
**Alternatives considered**: Tab-based navigation (rejected — doesn't scale for deep linking), separate layout per page (rejected — code duplication)
**Rationale**: React Router `Outlet` pattern is the standard for nested layouts. Single navbar ensures consistent UX across all admin pages.

### Decision: Navbar link rendering

**Choice**: Permission-gated links using `can()` hook, active state via `NavLink`
**Alternatives considered**: Pass pre-filtered links as props (rejected — AdminLayout would need to know about all permissions), hardcode links and hide via CSS (rejected — doesn't prevent navigation)
**Rationale**: Links should not appear for permissions the user doesn't have. `NavLink` provides `isActive` for styling.

### Decision: Route structure

**Choice**: Nested routes under `/admin` parent route
```
/admin              → Dashboard
/admin/products     → ProductsPage
/admin/news         → NewsPage  
/admin/events      → EventsPage
/admin/users       → UsersPage (includes Roles for ADMIN)
```

**Alternatives considered**: Flat routes with layout prop (works but less idiomatic), index route with redirect (adds unnecessary hop)
**Rationale**: Nested routes align with React Router v6 conventions and the `Outlet` model. Each page is a leaf route.

### Decision: RoleForm extraction

**Choice**: Extract `RoleForm` component from `UsersTab.tsx` to `components/RoleForm.tsx`
**Alternatives considered**: Keep inline in UsersPage (rejected — users tab is already large), create separate file in pages/admin (rejected — it's a shared form pattern)
**Rationale**: `RoleForm` is a reusable form component, not a page. `components/` is the correct location.

## Data Flow

```
Browser → /admin/* → ProtectedRoute → AdminLayout → Outlet → [Dashboard|ProductsPage|NewsPage|EventsPage|UsersPage]
                                              ↓
                                      Navbar (links + logout)
                                              ↓
                                      useAuth() → AuthContext → permissions
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `cfs/client/src/pages/admin/AdminLayout.tsx` | Create | Horizontal navbar + Outlet. Contains links based on permissions, logout button. |
| `cfs/client/src/pages/admin/Dashboard.tsx` | Create | Full dashboard page with stats (news count, pending reservations, product count) and recent reservations list. Replaces placeholder. |
| `cfs/client/src/pages/admin/ProductsPage.tsx` | Create | Products management. Logic moved from `ProductsTab.tsx`. |
| `cfs/client/src/pages/admin/NewsPage.tsx` | Create | News management. Logic moved from `NewsTab.tsx`. |
| `cfs/client/src/pages/admin/EventsPage.tsx` | Create | Events management. Logic moved from `EventsTab.tsx`. |
| `cfs/client/src/pages/admin/UsersPage.tsx` | Create | User + Role management. Logic moved from `UsersTab.tsx`. |
| `cfs/client/src/components/RoleForm.tsx` | Create | Extracted from `UsersTab.tsx`. Reusable role form component. |
| `cfs/client/src/App.tsx` | Modify | Replace single `/admin` route with nested routes using AdminLayout. |
| `cfs/client/src/pages/ControlPanel.tsx` | Delete | Replaced by page-based structure. |
| `cfs/client/src/pages/control-panel/*.tsx` | Delete | Tab components replaced by pages. |

## Component Contracts

### AdminLayout

```typescript
// Props: none (uses useAuth internally)
interface AdminLayoutProps {}
```

**Responsibilities**: Render horizontal navbar with nav links + logout. Render `Outlet` for page content. Apply background and padding theme.

**Navbar items** (based on permissions):
- Dashboard (`/admin`) — all authenticated users
- Productos (`/admin/products`) — `product.read` permission
- Noticias (`/admin/news`) — `news.read` permission  
- Eventos (`/admin/events`) — `event.read` permission
- Usuarios (`/admin/users`) — `user.read` permission

**Styling**: Follows existing theme system. Horizontal flex layout with `gap: theme.spacing.md`, logout button right-aligned.

### Dashboard

```typescript
interface DashboardProps {}
```

**Responsibilities**: Display stats (news count, pending reservations, product count) and recent reservations list with status filter buttons.

**Data**: `useAllNewsQuery`, `useProductsQuery`, `useReservationsQuery`

### ProductsPage

```typescript
interface ProductsPageProps {}
```

**Responsibilities**: Product list table with create/edit/delete. Permission-gated buttons. Inline form modal. Empty state message.

**Data**: `useProductsQuery`, `useReservationsQuery`, mutations from `graphql/mutations.ts`

### NewsPage

```typescript
interface NewsPageProps {}
```

**Responsibilities**: News list table with create/edit/delete. Permission-gated buttons. Inline form. Empty state.

**Data**: `useAllNewsQuery`, mutations

### EventsPage

```typescript
interface EventsPageProps {}
```

**Responsibilities**: Events list with create/edit (STAFF+) and delete (ADMIN only). Inline form. Empty state.

**Data**: `useAllEventsQuery`, mutations

### UsersPage

```typescript
interface UsersPageProps {}
```

**Responsibilities**: User list with create/delete (ADMIN only), self-delete prevention. Roles section (ADMIN only, uses `RoleForm`).

**Data**: `useUsersQuery`, `useRolesQuery`, user/role mutations

### RoleForm

```typescript
interface RoleFormProps {
  editingRole?: { id: string; name: string; permissions: string[] } | null
  onSave: (data: { name: string; permissions: string[] }, id?: string) => void
  onCancel: () => void
}
```

**Responsibilities**: Role name input (disabled for ADMIN/STAFF), permission checkboxes grid, save/cancel buttons.

## Routing Structure

```typescript
// App.tsx
<Route path="/admin" element={
  <ProtectedRoute>
    <AdminLayout />
  </ProtectedRoute>
}>
  <Route index element={<Dashboard />} />
  <Route path="products" element={<ProductsPage />} />
  <Route path="news" element={<NewsPage />} />
  <Route path="events" element={<EventsPage />} />
  <Route path="users" element={<UsersPage />} />
</Route>
```

**Migration Strategy**:
1. Create `pages/admin/` directory with all new components
2. Update `App.tsx` routing (adds nested routes, AdminLayout wrapper)
3. Delete `pages/ControlPanel.tsx`
4. Delete `pages/control-panel/` directory

This order ensures `/admin` works throughout the migration. If `App.tsx` routing fails, the old `ControlPanel.tsx` still exists for rollback.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | AdminLayout permissions, RoleForm interactions | Render with mocked auth, verify link visibility |
| Integration | Full routing under `/admin/*` | `MemoryRouter` with route matching |
| E2E | Navigate admin pages, create/edit/delete flows | Playwright/Cypress if available |

**Note**: Existing `ControlPanel.test.tsx` tests will need migration to test new page components. Dashboard stats tests are most critical to preserve.

## Migration / Rollout

1. **Create** `pages/admin/` directory structure
2. **Create** `AdminLayout.tsx` with basic navbar
3. **Create** each page component (Dashboard, ProductsPage, NewsPage, EventsPage, UsersPage)
4. **Create** `RoleForm.tsx` in `components/`
5. **Update** `App.tsx` with nested routes (test at each step)
6. **Delete** `ControlPanel.tsx` and `control-panel/` directory

**Rollback**: Revert `App.tsx` to single `/admin` → `ControlPanel` route. Restore `ControlPanel.tsx` from git.

## Open Questions

- [ ] Should there be a redirect from `/admin/control-panel` to `/admin`? (Current proposal doesn't include this)
- [ ] Confirm: Does ProductsPage need the reservation stats (pending count) as shown in the current placeholder Dashboard? The original ControlPanel had this in the main dashboard, not per-product page.