# Proposal: ControlPanel Restructuring

## Intent

Transform the monolithic ~2500-line `ControlPanel.tsx` into a page-based structure with horizontal navbar. The current tab-based architecture doesn't scale for detail pages (`/admin/users/:id`), create/edit modals, or deep linking. This refactor enables granular routing while preserving existing auth (JWT) and permission systems.

## Scope

### In Scope
- Horizontal navbar layout (`AdminLayout`) shared across all admin pages
- Page routing: `/admin` (Dashboard), `/admin/products`, `/admin/news`, `/admin/events`, `/admin/users`, `/admin/users/roles`
- Extract existing Tab components (`ProductsTab`, `NewsTab`, `EventsTab`, `UsersTab`) as standalone pages
- Dashboard: stats overview + recent reservations list
- Users page includes Roles section (ADMIN only) — extracted from `UsersTab`
- Preserve existing permission guards (`can('resource.verb')`)
- Preserve JWT auth via HttpOnly cookies

### Out of Scope
- Detail pages (`/admin/users/:id`) — future change
- UI framework adoption (Tailwind, Chakra, etc.)
- GraphQL API changes
- Product options management refactor (already works)

## Capabilities

### New Capabilities
- `admin-routing`: Page-based navigation under `/admin/*` with React Router nested routes
- `admin-navbar`: Horizontal navbar with logout + nav links, shown on all admin pages
- `admin-pages`: Individual pages for Dashboard, Products, News, Events, Users

### Modified Capabilities
- `product-management`: Split from monolithic ControlPanel; form/modal behavior unchanged
- `news-management`: Split from monolithic ControlPanel; form/modal behavior unchanged
- `event-management`: Split from monolithic ControlPanel; form/modal behavior unchanged
- `user-management`: Split from monolithic ControlPanel; now includes Roles for ADMIN
- `role-management`: Extracted to Users page (ADMIN only) — behavior unchanged

## Approach

```
/admin                    → Dashboard (stats + recent reservations)
/admin/products           → ProductsTab.tsx (unchanged logic)
/admin/news               → NewsTab.tsx (unchanged logic)
/admin/events             → EventsTab.tsx (unchanged logic)
/admin/users              → UsersTab.tsx (unchanged logic, roles nested)
/admin/users/roles        → Roles section within UsersTab (ADMIN only)
```

1. **AdminLayout component**: Horizontal navbar + `{children}`. Navbar shows nav links based on permissions. Wraps all `/admin/*` routes.
2. **App.tsx routing**: Update existing `/admin` route to use `AdminLayout` with nested routes.
3. **Tab components**: Move from `control-panel/` subdirectory to pages root, import into router.
4. **RoleForm**: Extract from `UsersTab.tsx` to `components/` for reuse within Users page.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `client/src/App.tsx` | Modified | Add nested routes under `/admin` |
| `client/src/pages/ControlPanel.tsx` | Removed | Replaced by page-based structure |
| `client/src/pages/admin/` (new) | New | Admin pages + AdminLayout |
| `client/src/pages/control-panel/*.tsx` | Reused | Tab components become pages |
| `client/src/components/` (new) | New | Shared components (RoleForm) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Routing regression | Low | Existing tests cover `/admin` route; add integration test for new routes |
| Permission guard broken | Medium | Verify all `can()` checks still fire on new page boundaries |
| Form state loss on navigation | Low | Forms are page-scoped; modals stay inline |

## Rollback Plan

1. Revert `App.tsx` routing to single `/admin` route pointing to `ControlPanel`
2. Delete `client/src/pages/admin/` directory
3. Restore `client/src/pages/ControlPanel.tsx` from git

## Dependencies

- React Router v6 (already in use)
- Existing GraphQL queries/mutations (unchanged)

## Success Criteria

- [ ] `/admin` renders Dashboard with stats
- [ ] `/admin/products` renders product list with create/edit forms
- [ ] `/admin/users` renders user list; Roles section visible only to ADMIN
- [ ] All permission guards (`can()`) work on new page boundaries
- [ ] Logout button accessible from navbar on all admin pages
- [ ] No console errors on navigation between pages
