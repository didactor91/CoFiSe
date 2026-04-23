# Spec: admin-routing

## Purpose

The admin-routing domain provides page-based navigation under `/admin/*` using React Router nested routes.

## Requirements

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

## Source

Archived from `control-panel-restructuring` change (2026-04-24)
