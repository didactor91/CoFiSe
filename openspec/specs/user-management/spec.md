# Spec: user-management

## Purpose

The user-management domain provides user list, user creation, user deletion, and role management functionality within the admin interface.

## Requirements

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

### Requirement: Admin UI — User Management Section

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

#### Scenario: Roles section for ADMIN

- GIVEN an authenticated ADMIN user viewing the Users page
- WHEN the page loads
- THEN the Roles section is visible
- AND ADMIN can create and delete roles via RoleForm component

## Source

Archived from `control-panel-restructuring` change (2026-04-24)
