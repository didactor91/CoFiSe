# Spec: product-management

## Requirements (from product-crud change, archived 2026-04-23)

### Requirement: createProduct Mutation

The system SHALL allow STAFF and ADMIN roles to create a new product via the `createProduct` mutation. The mutation MUST accept `CreateProductInput` and return the created `Product` type.

#### Scenario: Successful product creation

- GIVEN an authenticated staff/admin user with valid input (name, description, price, stock, optional imageUrl)
- WHEN `createProduct(input: CreateProductInput!)` is called
- THEN the product is inserted into the database with generated id and timestamps
- AND the full `Product` object is returned

#### Scenario: Create product with minimum fields

- GIVEN an authenticated staff/admin user providing only required fields (name, description, price, stock)
- WHEN `createProduct` is called without `imageUrl`
- THEN product is created with `imageUrl` set to `null`
- AND creation succeeds

#### Scenario: Unauthenticated user cannot create product

- GIVEN an unauthenticated user (no token)
- WHEN `createProduct` is called
- THEN an "Unauthorized" error is thrown

#### Scenario: Non-staff user cannot create product

- GIVEN an authenticated user with role `USER` (if such role existed)
- WHEN `createProduct` is called
- THEN an "Insufficient permissions" error is thrown

### Requirement: updateProduct Mutation

The system SHALL allow STAFF and ADMIN roles to update an existing product via the `updateProduct` mutation. The mutation MUST accept `id` and `UpdateProductInput`, and return the updated `Product` type. Partial updates are supported.

#### Scenario: Successful full update

- GIVEN an authenticated staff/admin user and a valid product `id`
- WHEN `updateProduct(id: ID!, input: UpdateProductInput!)` is called with all fields
- THEN all provided fields are updated in the database
- AND `updatedAt` timestamp is refreshed
- AND the updated `Product` is returned

#### Scenario: Partial update (price only)

- GIVEN an authenticated staff/admin user and a product with existing values
- WHEN `updateProduct` is called with only `price` in input
- THEN `price` is updated while `name`, `description`, `stock`, `imageUrl` remain unchanged

#### Scenario: Update non-existent product

- GIVEN an authenticated staff/admin user and a product `id` that does not exist
- WHEN `updateProduct` is called
- THEN a "Product not found" error is thrown

#### Scenario: Unauthenticated update attempt

- GIVEN an unauthenticated user
- WHEN `updateProduct` is called
- THEN an "Unauthorized" error is thrown

### Requirement: deleteProduct Mutation

The system SHALL allow STAFF and ADMIN roles to delete a product via the `deleteProduct` mutation. The mutation MUST accept `id` and return `Boolean`.

#### Scenario: Successful deletion

- GIVEN an authenticated staff/admin user and a valid product `id`
- WHEN `deleteProduct(id: ID!)` is called
- THEN the product row is removed from the database
- AND `true` is returned

#### Scenario: Delete non-existent product

- GIVEN an authenticated staff/admin user and a product `id` that does not exist
- WHEN `deleteProduct` is called
- THEN a "Product not found" error is thrown

#### Scenario: Delete product with existing reservations

- GIVEN an authenticated staff/admin user and a product `id` that has active reservations (status PENDING or CONFIRMED)
- WHEN `deleteProduct` is called
- THEN deletion succeeds (no cascade or FK constraint enforcement in v1)
- AND the product is deleted even if orphaned reservations exist
- AND this behavior is documented for v1 (soft delete is future work)

### Requirement: Input Validation

The system MUST enforce validation rules on product input fields.

#### Scenario: Price must be greater than zero

- GIVEN an input with `price <= 0`
- WHEN `createProduct` or `updateProduct` is called
- THEN a validation error is thrown with message "Price must be greater than 0"

#### Scenario: Stock must be non-negative

- GIVEN an input with `stock < 0`
- WHEN `createProduct` or `updateProduct` is called
- THEN a validation error is thrown with message "Stock must be 0 or greater"

#### Scenario: Name is required and non-empty

- GIVEN an input with missing or empty `name`
- WHEN `createProduct` is called
- THEN a validation error is thrown with message "Name is required"

#### Scenario: Description allows very long text

- GIVEN an input with `description` exceeding 10,000 characters
- WHEN `createProduct` is called
- THEN the product is created successfully (no length limit in v1)

#### Scenario: Name maximum length

- GIVEN an input with `name` exceeding 500 characters
- WHEN `createProduct` is called
- THEN a validation error is thrown with message "Name must be 500 characters or less"

### Requirement: Role-Based Access Control

The system MUST enforce that product mutations are only accessible to STAFF and ADMIN roles.

#### Scenario: Public cannot access mutations

- GIVEN an unauthenticated request
- WHEN any of `createProduct`, `updateProduct`, `deleteProduct` is called
- THEN an "Unauthorized" error is thrown before any validation

#### Scenario: Staff role can access all mutations

- GIVEN an authenticated user with role `STAFF`
- WHEN any product mutation is called
- THEN the operation succeeds (after validation)

#### Scenario: Admin role can access all mutations

- GIVEN an authenticated user with role `ADMIN`
- WHEN any product mutation is called
- THEN the operation succeeds (after validation)

### Requirement: ProductDetail Page

The system SHALL provide a public detail page at `/products/:id` that displays full product information.

#### Scenario: Product detail displays all fields

- GIVEN a product exists with name "Test Product", price 29.90, description, stock 10, limitedStock true, imageUrl, and options
- WHEN user views `/products/:id`
- THEN the page displays name in `<h1>`, image if exists, price formatted as "29.90€"
- AND stock badge: "En stock" (green) when stock > 0

#### Scenario: Product detail stock states

- GIVEN a product with `limitedStock: false`
- WHEN user views `/products/:id`
- THEN stock badge shows "Stock infinito" in gray

- GIVEN a product with `stock: 0` and `limitedStock: true`
- WHEN user views `/products/:id`
- THEN stock badge shows "Sin stock" in red

#### Scenario: Product detail options display

- GIVEN a product has options with name "Size" and values ["S", "M", "L"]
- WHEN user views `/products/:id`
- THEN below the price, a row shows "Size:" followed by three badge chips

- GIVEN a product has no options
- WHEN user views `/products/:id`
- THEN no options section is rendered

#### Scenario: Product detail loading state

- GIVEN user navigates to `/products/:id`
- WHEN the query is loading
- THEN a centered spinner with "⏳" and "Cargando..." is displayed

#### Scenario: Product detail error state

- GIVEN no product with the given id exists
- WHEN user navigates to `/products/:id`
- THEN "Producto no encontrado" is displayed with a "Volver" button

#### Scenario: Product detail navigable from Landing

- GIVEN user is on the Landing page with product preview displayed
- WHEN user clicks a product card
- THEN browser navigates to `/products/:id`

#### Scenario: Product detail navigable from Admin

- GIVEN user is on `/admin/products`
- WHEN user clicks a table row
- THEN browser navigates to `/products/:id?from=admin`

#### Scenario: Product detail admin mode

- GIVEN user navigates to `/products/abc?from=admin`
- THEN a "Modo Admin" badge is displayed in the page header
- AND a "Volver" button navigates back to admin list

### Requirement: Admin UI — Product Management Section

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

#### Scenario: Zero stock display

- GIVEN a product with `stock = 0`
- WHEN the product list is displayed
- THEN the Stock column shows "0" with a visual indicator (e.g., red text or "Out of stock" badge)

## Requirements (from control-panel-restructuring change, archived 2026-04-24)

Routing updated: Products page now accessible at `/admin/products` (previously part of monolithic ControlPanel)

## GraphQL Schema Additions

```graphql
# Input types (add to schema.ts)
input CreateProductInput {
  name: String!
  description: String!
  price: Float!
  stock: Int!
  imageUrl: String
}

input UpdateProductInput {
  name: String
  description: String
  price: Float
  stock: Int
  imageUrl: String
}

# Mutations (add to Mutation type in schema.ts)
# Product (Staff or Admin)
createProduct(input: CreateProductInput!): Product!
updateProduct(id: ID!, input: UpdateProductInput!): Product!
deleteProduct(id: ID!): Boolean!
```

## UI Component Specifications

### Product List Table

| Column | Type | Notes |
|--------|------|-------|
| Name | string | Primary identifier |
| Price | currency | Formatted with locale (e.g., "€19.99") |
| Stock | number | Red text if 0, normal otherwise |
| Actions | buttons | Edit (primary), Delete (danger) |

### Product Form

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Name | text input | max 500 chars | Yes |
| Description | textarea | no limit | Yes |
| Price | number input | > 0, step 0.01 | Yes |
| Stock | number input | >= 0, integer | Yes |
| Image URL | text input | valid URL format (optional) | No |

### Delete Confirmation Dialog

- Title: "Delete Product"
- Body: "Are you sure you want to delete '{productName}'? This action cannot be undone."
- Buttons: "Cancel" (secondary), "Delete" (danger)
