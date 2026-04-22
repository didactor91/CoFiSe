# Spec: cfs-landing — CFS Landing & Management Platform

## Overview

This spec defines the functional requirements, scenarios, and acceptance criteria for the CFS web platform.

**Language**: Code/docs in English; Web UI in Spanish.

---

## Module: Landing Page

### FR-001: Public News Feed
The landing page MUST display a list of news items ordered by creation date (most recent first).

**Scenario: View news feed**
- Given: A visitor accesses `/`
- When: The page loads
- Then: The news feed displays all published news items with title, excerpt, and date

**Scenario: Empty news feed**
- Given: No news items exist in the database
- When: A visitor accesses `/`
- Then: A message "No hay noticias todavía" is displayed

### FR-002: News Item Detail
The landing page MUST display the full content of a news item when clicked.

**Scenario: View news item**
- Given: A news item exists with id `X`
- When: A visitor clicks on the news item
- Then: The full content of the news item is displayed

### FR-003: Catalog Preview
The landing page SHOULD display a preview of the product catalog (up to 6 items).

---

## Module: News Module

### FR-010: Create News (Admin + Staff)
Admin and staff users MUST be able to create news items.

**Scenario: Create news item**
- Given: A user is authenticated with `admin` or `staff` role
- When: The user submits a new news item with `title` and `content`
- Then: A news item is created with `id`, `title`, `content`, `createdAt`, `updatedAt`
- And: The user receives the created news item

**Required fields**:
- `title`: string (min 1, max 200 chars)
- `content`: string (min 1, max 5000 chars)

**Optional fields**:
- `imageUrl`: string (URL to image)

### FR-011: Read News (Admin + Staff)
Admin and staff users MUST be able to list and view news items.

**Scenario: List all news**
- Given: A user is authenticated with `admin` or `staff` role
- When: The user requests the news list
- Then: All news items are returned ordered by `createdAt` DESC

**Scenario: View single news**
- Given: A news item with id `X` exists
- When: An authenticated user requests the news item by id
- Then: The full news item is returned

### FR-012: Update News (Admin + Staff)
Admin and staff users MUST be able to update news items.

**Scenario: Update news item**
- Given: A news item with id `X` exists
- And: A user is authenticated with `admin` or `staff` role
- When: The user submits an update with new `title` or `content`
- Then: The news item is updated with new values
- And: `updatedAt` is set to current timestamp

### FR-013: Delete News (Admin + Staff)
Admin and staff users MUST be able to delete news items.

**Scenario: Delete news item**
- Given: A news item with id `X` exists
- And: A user is authenticated with `admin` or `staff` role
- When: The user deletes the news item
- Then: The news item is removed from the database
- And: The user receives `true` for successful deletion

---

## Module: Catalog

### FR-020: List Products (Public)
The catalog MUST be publicly accessible without authentication.

**Scenario: Browse catalog**
- Given: Products exist in the database
- When: A visitor accesses `/catalog` or `/`
- Then: All products are displayed with `id`, `name`, `description`, `price`, `imageUrl`

**Scenario: View product detail**
- Given: A product with id `X` exists
- When: A visitor clicks on the product
- Then: Full product details are displayed including `stock` quantity

### FR-021: Product Schema
Products MUST have the following structure:

| Field | Type | Description |
|-------|------|-------------|
| `id` | ID | Unique identifier |
| `name` | string | Product name (min 1, max 100 chars) |
| `description` | string | Product description (max 1000 chars) |
| `price` | float | Price in EUR |
| `stock` | int | Available quantity |
| `imageUrl` | string | Product image URL (optional) |
| `createdAt` | datetime | Creation timestamp |
| `updatedAt` | datetime | Last update timestamp |

---

## Module: Reservations

### FR-030: Submit Reservation (Public)
Visitors MUST be able to submit reservation requests for products.

**Scenario: Submit reservation request**
- Given: A product with id `X` has `stock > 0`
- When: A visitor submits a reservation with `productId`, `quantity`, `name`, `email`, `phone`, `notes`
- Then: A reservation is created with status `pending`
- And: The visitor receives a confirmation

**Required fields**:
- `productId`: ID (must exist)
- `quantity`: int (min 1, max requested quantity)
- `name`: string (min 1, max 100 chars)
- `email`: string (valid email format)
- `phone`: string (min 9, max 20 chars)

**Optional fields**:
- `notes`: string (max 500 chars)

**Reservation statuses**: `pending`, `confirmed`, `cancelled`, `completed`

### FR-031: View Reservations (Staff + Admin)
Staff and admin users MUST be able to view all reservations.

**Scenario: List all reservations**
- Given: A user is authenticated with `admin` or `staff` role
- When: The user requests the reservation list
- Then: All reservations are returned ordered by `createdAt` DESC
- And: Each reservation includes product name and customer info

**Scenario: Filter reservations by status**
- Given: A user is authenticated with `admin` or `staff` role
- When: The user filters reservations by status `pending`
- Then: Only reservations with that status are returned

### FR-032: Update Reservation Status (Staff + Admin)
Staff and admin users MUST be able to update reservation status.

**Scenario: Confirm reservation**
- Given: A reservation with id `X` has status `pending`
- And: A user is authenticated with `admin` or `staff` role
- When: The user updates the status to `confirmed`
- Then: The reservation status is updated
- And: Product stock is decreased by reservation quantity

**Scenario: Cancel reservation**
- Given: A reservation with id `X` has status `pending` or `confirmed`
- And: A user is authenticated with `admin` or `staff` role
- When: The user updates the status to `cancelled`
- Then: The reservation status is updated
- And: If was `confirmed`, product stock is restored

---

## Module: Authentication

### FR-040: Login
Users MUST be able to log in with email and password.

**Scenario: Successful login**
- Given: A user with email `user@test.com` and password `secret` exists
- When: The user submits `login(email: "user@test.com", password: "secret")`
- Then: A JWT token is returned with `{ id, email, role }`
- And: Token expires in 24 hours

**Scenario: Failed login - wrong password**
- Given: A user with email `user@test.com` exists with password `secret`
- When: The user submits `login(email: "user@test.com", password: "wrong")`
- Then: An error "Invalid credentials" is returned
- And: No token is issued

**Scenario: Failed login - user not found**
- Given: No user with email `user@test.com` exists
- When: A visitor submits `login(email: "user@test.com", password: "any")`
- Then: An error "Invalid credentials" is returned

### FR-041: JWT Verification
Protected endpoints MUST verify JWT tokens.

**Scenario: Valid token**
- Given: A request includes a valid JWT in `Authorization: Bearer <token>`
- When: The server verifies the token
- Then: The request proceeds with user context `{ id, email, role }`

**Scenario: Expired token**
- Given: A request includes an expired JWT
- When: The server verifies the token
- Then: An error "Token expired" is returned with 401

**Scenario: Invalid token**
- Given: A request includes a malformed or invalid JWT
- When: The server verifies the token
- Then: An error "Invalid token" is returned with 401

### FR-042: Role-Based Access Control
The system MUST enforce role-based permissions.

| Endpoint | Admin | Staff | Public |
|----------|-------|-------|--------|
| Query: news (public) | ✅ | ✅ | ✅ |
| Query: news (all - staff) | ✅ | ✅ | ❌ |
| Mutation: createNews | ✅ | ✅ | ❌ |
| Mutation: updateNews | ✅ | ✅ | ❌ |
| Mutation: deleteNews | ✅ | ✅ | ❌ |
| Query: products | ✅ | ✅ | ✅ |
| Query: reservations | ✅ | ✅ | ❌ |
| Mutation: createReservation (public) | ✅ | ✅ | ✅ |
| Mutation: updateReservationStatus | ✅ | ✅ | ❌ |
| Query: users | ✅ | ❌ | ❌ |
| Mutation: createUser | ✅ | ❌ | ❌ |
| Mutation: deleteUser | ✅ | ❌ | ❌ |

---

## Module: User Management (Admin Only)

### FR-050: Create Staff User
Admin users MUST be able to create staff accounts.

**Scenario: Create staff user**
- Given: A user is authenticated with `admin` role
- When: The user submits `createUser(email, password, role: "staff")`
- Then: A new user is created with the specified role
- And: The user receives the created user (without password)

**Required fields**:
- `email`: string (valid email, unique)
- `password`: string (min 8 chars)
- `role`: enum (`admin`, `staff`)

### FR-051: Delete User
Admin users MUST be able to delete users.

**Scenario: Delete user**
- Given: A user with id `X` exists (not the current admin)
- And: A user is authenticated with `admin` role
- When: The admin deletes user `X`
- Then: The user is removed from the database

**Constraint**: Admin cannot delete themselves.

### FR-052: List Users
Admin users MUST be able to list all users.

**Scenario: List users**
- Given: A user is authenticated with `admin` role
- When: The user requests the user list
- Then: All users are returned with `id`, `email`, `role`, `createdAt`
- And: Passwords are NEVER returned

---

## Module: Control Panel

### FR-060: Staff Dashboard
Staff users MUST have access to a dashboard showing news, catalog, and reservations.

**Scenario: Access control panel**
- Given: A user is authenticated with `staff` or `admin` role
- When: The user accesses `/admin`
- Then: A dashboard is displayed with:
  - Quick stats (news count, pending reservations, product count)
  - Recent news items
  - Recent reservations

### FR-061: Admin Dashboard
Admin users MUST have access to user management from the dashboard.

**Scenario: Access admin panel**
- Given: A user is authenticated with `admin` role
- When: The user accesses `/admin`
- Then: The dashboard includes a "Usuarios" section
- And: The admin can create/delete staff users

---

## GraphQL Schema (Draft)

```graphql
scalar DateTime

type News {
  id: ID!
  title: String!
  content: String!
  imageUrl: String
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Product {
  id: ID!
  name: String!
  description: String!
  price: Float!
  stock: Int!
  imageUrl: String
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Reservation {
  id: ID!
  product: Product!
  productId: ID!
  quantity: Int!
  name: String!
  email: String!
  phone: String!
  notes: String
  status: ReservationStatus!
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum ReservationStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
}

type User {
  id: ID!
  email: String!
  role: UserRole!
  createdAt: DateTime!
}

enum UserRole {
  ADMIN
  STAFF
}

type AuthPayload {
  token: String!
  user: User!
}

# Queries
type Query {
  # Public
  news: [News!]!
  newsItem(id: ID!): News
  products: [Product!]!
  product(id: ID!): Product
  me: User

  # Protected (staff, admin)
  allNews: [News!]!
  reservations(status: ReservationStatus): [Reservation!]!
  reservation(id: ID!): Reservation

  # Admin only
  users: [User!]!
}

# Mutations
type Mutation {
  # Public
  createReservation(input: CreateReservationInput!): Reservation!
  login(email: String!, password: String!): AuthPayload!

  # News (staff, admin)
  createNews(input: CreateNewsInput!): News!
  updateNews(id: ID!, input: UpdateNewsInput!): News!
  deleteNews(id: ID!): Boolean!

  # Reservations (staff, admin)
  updateReservationStatus(id: ID!, status: ReservationStatus!): Reservation!

  # Admin only
  createUser(input: CreateUserInput!): User!
  deleteUser(id: ID!): Boolean!
}

input CreateReservationInput {
  productId: ID!
  quantity: Int!
  name: String!
  email: String!
  phone: String!
  notes: String
}

input CreateNewsInput {
  title: String!
  content: String!
  imageUrl: String
}

input UpdateNewsInput {
  title: String
  content: String
  imageUrl: String
}

input CreateUserInput {
  email: String!
  password: String!
  role: UserRole!
}
```

---

## Database Schema (SQLite)

### users
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| email | TEXT | UNIQUE NOT NULL |
| password | TEXT | NOT NULL (bcrypt hash) |
| role | TEXT | NOT NULL (admin/staff) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

### news
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| title | TEXT | NOT NULL |
| content | TEXT | NOT NULL |
| image_url | TEXT | |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

### products
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| name | TEXT | NOT NULL |
| description | TEXT | |
| price | REAL | NOT NULL |
| stock | INTEGER | DEFAULT 0 |
| image_url | TEXT | |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

### reservations
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| product_id | INTEGER | REFERENCES products(id) |
| quantity | INTEGER | NOT NULL |
| name | TEXT | NOT NULL |
| email | TEXT | NOT NULL |
| phone | TEXT | NOT NULL |
| notes | TEXT | |
| status | TEXT | DEFAULT 'pending' |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

---

## Acceptance Criteria

### AC-001: Landing Page
- [ ] Shows news feed sorted by date (newest first)
- [ ] Shows "No hay noticias todavía" when empty
- [ ] Displays catalog preview (up to 6 items)

### AC-002: News Management
- [ ] Staff and admin can create news with title, content, optional image
- [ ] Staff and admin can edit their own news
- [ ] Staff and admin can delete news
- [ ] News list shows all news for staff, only public for visitors

### AC-003: Catalog
- [ ] Products are publicly visible
- [ ] Product detail shows all info including stock
- [ ] No checkout/payment flow

### AC-004: Reservations
- [ ] Visitors can submit reservation request without auth
- [ ] Reservation creates with status `pending`
- [ ] Staff can view all reservations
- [ ] Staff can filter by status
- [ ] Staff can confirm/cancel reservations
- [ ] Confirming decreases product stock
- [ ] Cancelling restores stock if was confirmed

### AC-005: Authentication
- [ ] Login with email/password returns JWT
- [ ] JWT expires in 24 hours
- [ ] Protected endpoints reject invalid/expired tokens
- [ ] Role-based access is enforced

### AC-006: User Management
- [ ] Admin can create staff users
- [ ] Admin can delete users (not themselves)
- [ ] Admin can list all users
- [ ] Passwords never returned in responses

### AC-007: Control Panel
- [ ] Staff dashboard shows stats, recent news, recent reservations
- [ ] Admin dashboard includes user management section

### AC-008: UI/UX
- [ ] All web UI text in Spanish
- [ ] Minimal Dark Luxury aesthetic
- [ ] Responsive design (mobile-friendly)

---

## Edge Cases

| Case | Handling |
|------|----------|
| Reservation for product with 0 stock | Return error "Producto sin stock disponible" |
| Reservation quantity > stock | Return error "Stock insuficiente" |
| Create user with existing email | Return error "Email ya registrado" |
| Delete self as admin | Return error "No puedes eliminarte a ti mismo" |
| Empty search results | Return empty array, not error |
| GraphQL validation errors | Return proper GraphQL errors with extensions |

---

## Out of Scope (v1)

- Payment processing
- Email/SMS notifications
- Multi-language
- Mobile apps
- Order history for end users
- Real-time updates (WebSocket)