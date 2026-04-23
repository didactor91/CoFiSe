# Delta Spec: ControlPanel Restructuring

## Scope

Transform monolithic ControlPanel (~2500 lines) into page-based structure with horizontal navbar. Restructure routing to support `/admin/*` nested routes while preserving existing auth, permissions, and UI behavior.

---

## ADDED Requirements

### Requirement: admin-routing

The system SHALL provide page-based navigation under `/admin/*` using React Router nested routes. The routing structure MUST support: `/admin` (Dashboard), `/admin/products`, `/admin/news`, `/admin/events`, `/admin/users`, and `/admin/users/roles`.

#### Scenario: Route to Dashboard

- GIVEN an authenticated staff/admin user navigates to `/admin`
- WHEN the route renders
- THEN the AdminLayout component wraps the Dashboard page
- AND the URL reflects `/admin`

#### Scenario: Route to Products page

- GIVEN an authenticated staff/admin user navigates to `/admin/products`
- WHEN the route renders
- THEN the AdminLayout component wraps the Products page
- AND the Products page displays the product list with create/edit forms

#### Scenario: Route to News page

- GIVEN an authenticated staff/admin user navigates to `/admin/news`
- WHEN the route renders
- THEN the AdminLayout component wraps the News page
- AND the News page displays the news list with create/edit forms

#### Scenario: Route to Events page

- GIVEN an authenticated staff/admin user navigates to `/admin/events`
- WHEN the route renders
- THEN the AdminLayout component wraps the Events page
- AND the Events page displays the events list with create/edit forms

#### Scenario: Route to Users page

- GIVEN an authenticated staff/admin user navigates to `/admin/users`
- WHEN the route renders
- THEN the AdminLayout component wraps the Users page
- AND the Users page displays the user list with create/delete functionality

#### Scenario: Route to Roles section (ADMIN only)

- GIVEN an authenticated ADMIN user navigates to `/admin/users/roles`
- WHEN the route renders
- THEN the Users page displays the Roles section alongside user management

### Requirement: admin-navbar

The system SHALL render a horizontal navbar (AdminLayout) on all `/admin/*` routes. The navbar MUST display: navigation links based on user permissions, and a logout button accessible from all admin pages.

#### Scenario: Navbar displays navigation links

- GIVEN an authenticated staff/admin user on any `/admin/*` page
- WHEN the page renders
- THEN the navbar displays links: Dashboard, Productos, Noticias, Eventos, Usuarios (based on role permissions)
- AND the active page link is visually distinguished

#### Scenario: Navbar logout button

- GIVEN an authenticated user on any `/admin/*` page
- WHEN the user clicks the "Cerrar Sesión" button in the navbar
- THEN the user is logged out and redirected to the home/login page

#### Scenario: Navbar hides links based on permissions

- GIVEN an authenticated user without `user.create` or `user.delete` permissions (non-ADMIN)
- WHEN the navbar renders
- THEN the "Usuarios" link is hidden or disabled
- AND the user cannot navigate to `/admin/users`

### Requirement: admin-pages

The system SHALL provide standalone page components for each admin section: Dashboard, Products, News, Events, Users. Each page MUST maintain the existing form/modal behavior from the monolithic ControlPanel.

#### Scenario: Dashboard page displays stats

- GIVEN an authenticated staff/admin user on `/admin`
- WHEN the Dashboard page renders
- THEN it displays: news count stat, pending reservations stat, product count stat
- AND a list of recent reservations filtered by status

#### Scenario: Products page retains existing form behavior

- GIVEN an authenticated staff/admin user on `/admin/products`
- WHEN the user clicks "Añadir Producto"
- THEN the product form appears with fields: Name, Description, Price, Stock, Image URL, optional product options
- AND the validation rules (price > 0, name required, max 500 chars) remain unchanged

#### Scenario: Products page create product

- GIVEN an authenticated staff/admin user viewing the Products page
- WHEN the user submits a valid product form
- THEN `createProduct` mutation is called
- AND the product list refreshes to show the new product

#### Scenario: Products page edit product

- GIVEN an authenticated staff/admin user viewing the Products page
- WHEN the user clicks "Edit" on a product row
- THEN the product form pre-fills with existing values
- AND "Save" calls `updateProduct` mutation

#### Scenario: Products page delete product

- GIVEN an authenticated staff/admin user viewing the Products page
- WHEN the user clicks "Delete" on a product row
- THEN a confirmation dialog appears
- AND on confirm, `deleteProduct` mutation is called

#### Scenario: Products page empty state

- GIVEN an authenticated staff/admin user viewing the Products page with no products
- THEN the page displays: "No products yet. Click 'Añadir Producto' to create one."

#### Scenario: News page retains existing form behavior

- GIVEN an authenticated staff/admin user on `/admin/news`
- WHEN the user clicks "Añadir Noticia"
- THEN the news form appears with fields: Title, Content, Image URL (optional)
- AND validation (title required, content required) remains unchanged

#### Scenario: News page create news

- GIVEN an authenticated staff/admin user viewing the News page
- WHEN the user submits a valid news form
- THEN `createNews` mutation is called
- AND the news list refreshes to show the new item

#### Scenario: News page empty state

- GIVEN an authenticated staff/admin user viewing the News page with no news
- THEN the page displays: "No news yet. Click 'Añadir Noticia' to create one."

#### Scenario: Events page retains existing form behavior

- GIVEN an authenticated staff/admin user on `/admin/events`
- WHEN the user clicks "Añadir Evento"
- THEN the event form appears with fields: Name, Description, Location, Start Time, End Time
- AND validation (end_time must be after start_time, name max 200 chars) remains unchanged

#### Scenario: Events page empty state

- GIVEN an authenticated staff/admin user viewing the Events page with no events
- THEN the page displays: "No events yet. Click 'Añadir Evento' to create one."

#### Scenario: Users page displays user list

- GIVEN an authenticated user with `user.create` and `user.delete` permissions
- WHEN the Users page renders
- THEN a table displays all users with columns: Email, Role, Actions (Delete)
- AND a "Crear Usuario" form appears above the table

#### Scenario: Users page create user

- GIVEN an authenticated user with `user.create` permission
- WHEN the user submits the create user form
- THEN `createUser` mutation is called with email, password, role

#### Scenario: Users page delete user

- GIVEN an authenticated user with `user.delete` permission
- WHEN the user clicks "Delete" on a user row (not self)
- THEN `deleteUser` mutation is called
- AND self-delete is prevented (user cannot delete own account)

#### Scenario: Users page empty state

- GIVEN an authenticated user viewing the Users page with no users
- THEN the page displays: "No users yet."

### Requirement: Permission guards

The system MUST preserve existing permission checks (`can('resource.verb')`) on page boundaries. All existing guards MUST fire correctly after the restructuring.

#### Scenario: STAFF cannot access Roles section

- GIVEN an authenticated user with STAFF role (not ADMIN)
- WHEN the user navigates to `/admin/users/roles`
- THEN the Roles section is hidden or the user is redirected
- AND `role.create` and `role.delete` permission checks still apply

#### Scenario: Public user cannot access admin pages

- GIVEN an unauthenticated user (no JWT token)
- WHEN the user navigates to any `/admin/*` route
- THEN the user is redirected to login/home page
- AND no admin content is rendered

#### Scenario: Permission guards still fire per resource

- GIVEN an authenticated staff/admin user on the Products page
- WHEN the page renders
- THEN `can('product.create')`, `can('product.update')`, `can('product.delete')` checks control button visibility
- AND users without these permissions do not see create/edit/delete buttons

---

## MODIFIED Requirements

### Requirement: Admin UI — Product Management Section

(Previously: Product management section within monolithic ControlPanel with tab-based navigation)

The system SHALL provide a Products page at `/admin/products` accessible to STAFF and ADMIN users. The page MUST display a product list table and a product form modal. Product management behavior (validation, mutations) remains unchanged from the original ControlPanel implementation.

#### Scenario: Product list display

- GIVEN an authenticated staff/admin user viewing the Products page at `/admin/products`
- WHEN the page loads
- THEN a table displays all products with columns: Name, Price, Stock, Actions
- AND each row shows Edit and Delete buttons based on permissions

#### Scenario: Create product form

- GIVEN an authenticated staff/admin user on the Products page
- WHEN the user clicks "Añadir Producto"
- THEN a form appears with fields: Name (text, required, max 500 chars), Description (textarea, required), Price (number, required, > 0), Stock (number, >= 0), Image URL (text, optional), Product options (toggle + label + values)
- AND a "Guardar" button to submit

#### Scenario: Edit product flow

- GIVEN an authenticated staff/admin user on the Products page
- WHEN the user clicks "Edit" on a product row
- THEN the same form as create pre-fills with existing values
- AND "Guardar" updates the product via `updateProduct` mutation

#### Scenario: Delete product confirmation

- GIVEN an authenticated staff/admin user on the Products page
- WHEN the user clicks "Delete" on a product row
- THEN a confirmation dialog appears: "¿Eliminar producto '{name}'? Esta acción no se puede deshacer."
- AND on confirm, `deleteProduct` mutation is called

#### Scenario: Empty product list

- GIVEN an authenticated staff/admin user on the Products page with no products
- THEN the table shows: "No hay productos. Haz clic en 'Añadir Producto' para crear uno."

### Requirement: Admin UI — News Management Section

(Previously: News management section within monolithic ControlPanel with tab-based navigation)

The system SHALL provide a News page at `/admin/news` accessible to STAFF and ADMIN users. The page MUST display a news list table and a news form modal. News management behavior (validation, mutations) remains unchanged from the original ControlPanel implementation.

#### Scenario: News list display

- GIVEN an authenticated staff/admin user viewing the News page at `/admin/news`
- WHEN the page loads
- THEN a table displays all news items with columns: Title, Content preview, Image, Actions
- AND each row shows Edit and Delete buttons based on permissions

#### Scenario: Create news form

- GIVEN an authenticated staff/admin user on the News page
- WHEN the user clicks "Añadir Noticia"
- THEN a form appears with fields: Title (text, required), Content (textarea, required), Image URL (text, optional)
- AND a "Guardar" button to submit

#### Scenario: Edit news flow

- GIVEN an authenticated staff/admin user on the News page
- WHEN the user clicks "Edit" on a news row
- THEN the same form as create pre-fills with existing values
- AND "Guardar" updates the news via `updateNews` mutation

#### Scenario: Delete news confirmation

- GIVEN an authenticated staff/admin user on the News page
- WHEN the user clicks "Delete" on a news row
- THEN a confirmation dialog appears: "¿Eliminar noticia '{title}'? Esta acción no se puede deshacer."
- AND on confirm, `deleteNews` mutation is called

#### Scenario: Empty news list

- GIVEN an authenticated staff/admin user on the News page with no news
- THEN the table shows: "No hay noticias. Haz clic en 'Añadir Noticia' para crear una."

### Requirement: Admin UI — User Management Section

(Previously: User management section within monolithic ControlPanel)

The system SHALL provide a Users page at `/admin/users` accessible to users with `user.create` and `user.delete` permissions. The page MUST display a user list table and a create user form. User management behavior (create, delete, self-delete prevention) remains unchanged.

#### Scenario: User list display

- GIVEN an authenticated user with `user.create` and `user.delete` permissions viewing the Users page at `/admin/users`
- WHEN the page loads
- THEN a table displays all users with columns: Email, Role (badge), Actions
- AND a create user form above the table

#### Scenario: Create user flow

- GIVEN an authenticated user with `user.create` permission
- WHEN the user fills the create form (email, password, role: STAFF or ADMIN)
- AND submits the form
- THEN `createUser` mutation is called
- AND the user list refreshes

#### Scenario: Delete user flow

- GIVEN an authenticated user with `user.delete` permission
- WHEN the user clicks "Delete" on a user row
- THEN `deleteUser` mutation is called
- AND the user is removed from the list

#### Scenario: Self-delete prevention

- GIVEN an authenticated user viewing the Users page
- WHEN the user's own row is displayed
- THEN the Delete button is hidden or disabled for that row
- AND the user cannot delete their own account

#### Scenario: Empty user list

- GIVEN an authenticated user with permissions viewing the Users page with no users
- THEN the page shows: "No hay usuarios"

### Requirement: Admin UI — Event Management Section

(Previously: Event management section within monolithic ControlPanel)

The system SHALL provide an Events page at `/admin/events` accessible to STAFF and ADMIN users. The page MUST display an events list and event form. Event management behavior (validation, create, update, delete by ADMIN only) remains unchanged.

#### Scenario: Events list display

- GIVEN an authenticated staff/admin user viewing the Events page at `/admin/events`
- WHEN the page loads
- THEN a list displays all events with name, location, start/end times, and action buttons
- AND only ADMIN users see Delete buttons

#### Scenario: Create event flow

- GIVEN an authenticated staff/admin user on the Events page
- WHEN the user clicks "Añadir Evento"
- THEN an event form appears with fields: Name (required, max 200 chars), Description (optional), Location (required, max 300 chars), Start Time (required), End Time (required, must be after start time)
- AND "Guardar" calls `createEvent` mutation

#### Scenario: Edit event flow

- GIVEN an authenticated staff/admin user on the Events page
- WHEN the user clicks "Edit" on an event row
- THEN the event form pre-fills with existing values
- AND "Guardar" calls `updateEvent` mutation

#### Scenario: Delete event (ADMIN only)

- GIVEN an authenticated ADMIN user on the Events page
- WHEN the user clicks "Delete" on an event row
- THEN a confirmation dialog appears
- AND on confirm, `deleteEvent` mutation is called

- GIVEN an authenticated STAFF user on the Events page
- WHEN the page renders
- THEN no Delete buttons are displayed for any events

#### Scenario: Empty events list

- GIVEN an authenticated staff/admin user on the Events page with no events
- THEN the page shows: "No hay eventos. Haz clic en 'Añadir Evento' para crear uno."

---

## Modified Scenarios (from existing specs)

### For Product Management
- Scenario: Product list display — UPDATED to reference `/admin/products` route
- Scenario: Create product form — UNCHANGED (form behavior identical)
- Scenario: Edit product flow — UNCHANGED (form behavior identical)
- Scenario: Delete product confirmation — UNCHANGED (dialog behavior identical)
- Scenario: Empty product list — UPDATED message for consistency with Spanish UI

### For News Management
- Scenario: News list display — UPDATED to reference `/admin/news` route
- Scenario: Create news form — UNCHANGED (form behavior identical)
- Scenario: Edit news flow — UNCHANGED (form behavior identical)
- Scenario: Delete news confirmation — UNCHANGED (dialog behavior identical)
- Scenario: Empty news list — UPDATED message for consistency

### For Event Management
- Scenario: Admin event list display — UPDATED to reference `/admin/events` route
- Scenario: Admin event creation — UNCHANGED
- Scenario: Admin event update — UNCHANGED
- Scenario: Admin event deletion (ADMIN only) — UNCHANGED
- Scenario: Empty events list — UPDATED message for consistency

---

## Summary

| Domain | Type | Requirements | Scenarios |
|--------|------|-------------|-----------|
| admin-routing | ADDED | 1 | 6 |
| admin-navbar | ADDED | 1 | 3 |
| admin-pages | ADDED | 1 | 13 |
| product-management | MODIFIED | 1 | 5 |
| news-management | MODIFIED | 1 | 5 |
| event-management | MODIFIED | 1 | 5 |
| user-management | MODIFIED | 1 | 6 |
| **Total** | | **7** | **43** |

### Coverage
- Happy paths: Covered (navigation, CRUD operations, permissions)
- Edge cases: Covered (empty states, self-delete prevention, unauthorized access)
- Error states: Covered (validation errors, permission denial)