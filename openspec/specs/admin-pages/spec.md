# Spec: admin-pages

## Purpose

The admin-pages domain provides standalone page components for each admin section: Dashboard, Products, News, Events, Users.

## Requirements

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

## Source

Archived from `control-panel-restructuring` change (2026-04-24)
