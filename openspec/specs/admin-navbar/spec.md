# Spec: admin-navbar

## Purpose

The admin-navbar domain provides the horizontal navigation bar rendered on all `/admin/*` routes.

## Requirements

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

## Source

Archived from `control-panel-restructuring` change (2026-04-24)
