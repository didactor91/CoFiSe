# Design: product-crud

## Technical Approach

Add Product CRUD mutations (createProduct, updateProduct, deleteProduct) following the exact News CRUD pattern. The Product type and table already exist; only the mutation layer needs implementation. Validation happens in resolvers (not schema) to match existing conventions.

## Architecture Decisions

### Decision: Validation Location

**Choice**: Validation in resolvers, not schema
**Alternatives considered**: Schema-level validation directives
**Rationale**: Existing News CRUD uses resolver-side validation (throw on invalid price/stock). Consistent approach across codebase.

### Decision: Partial Update Pattern

**Choice**: Use nullish coalescing `??` to preserve existing values
**Alternatives considered**: Explicit field-by-field check
**Rationale**: Matches updateNews pattern (lines 284-286 in resolvers.ts). Clean and concise.

### Decision: Authorization Model

**Choice**: `requireStaff()` guard for all three mutations
**Alternatives considered**: requireAdmin for delete
**Rationale**: Spec says STAFF and ADMIN both have access. No special treatment for delete.

## Data Flow

```
Client (ControlPanel.tsx)
  │
  ├── useCreateProductMutation() → mutations.ts
  ├── useUpdateProductMutation() → mutations.ts  
  └── useDeleteProductMutation() → mutations.ts
        │
        ▼
GraphQL Mutation → resolvers.ts (auth check via requireStaff)
  │
  ▼
db.prepare().run() → SQLite products table
  │
  ▼
Return Product / Boolean
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `cfs/server/src/graphql/schema.ts` | Modify | Add `CreateProductInput`, `UpdateProductInput`, and 3 mutations to Mutation type |
| `cfs/server/src/graphql/resolvers.ts` | Modify | Add createProduct, updateProduct, deleteProduct resolver implementations |
| `cfs/client/src/graphql/mutations.ts` | Modify | Add useCreateProductMutation, useUpdateProductMutation, useDeleteProductMutation hooks |
| `cfs/client/src/pages/ControlPanel.tsx` | Modify | Add Product Management section with table, form, and delete confirmation |

## Interfaces / Contracts

### Resolver Signatures (resolvers.ts)

```typescript
createProduct: (_: any, args: { input: CreateProductInput }, ctx: Context) => {
  requireStaff(ctx)
  // Validate: name required, price > 0, stock >= 0
  // Insert → return Product
}

updateProduct: (_: any, args: { id: string; input: UpdateProductInput }, ctx: Context) => {
  requireStaff(ctx)
  // Check exists → validate fields → update → return Product
}

deleteProduct: (_: any, args: { id: string }, ctx: Context) => {
  requireStaff(ctx)
  // Check exists → delete → return true
}
```

### Validation Rules (per spec)

| Field | Rule | Error Message |
|-------|------|---------------|
| name | Required, non-empty | "Name is required" |
| name | Max 500 chars | "Name must be 500 characters or less" |
| price | > 0 | "Price must be greater than 0" |
| stock | >= 0 | "Stock must be 0 or greater" |

### DB Operations (follow News pattern)

```typescript
// createProduct
db.prepare(`
  INSERT INTO products (name, description, price, stock, image_url, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(name, description, price, stock, imageUrl || null, now, now)

// updateProduct - use existing pattern with ??
const name = args.input.name ?? existing.name

// deleteProduct
db.prepare(`DELETE FROM products WHERE id = ?`).run(args.id)
```

### Column Name Mapping (DB ↔ GraphQL)

| DB (snake_case) | GraphQL (camelCase) |
|-----------------|---------------------|
| image_url | imageUrl |
| created_at | createdAt |
| updated_at | updatedAt |

## Component Architecture (ControlPanel.tsx)

```
ControlPanel
  ├── Stats Dashboard (existing)
  ├── Recent News (existing)
  ├── Recent Reservations (existing)
  ├── User Management (existing, admin only)
  │
  └── Product Management Section (NEW)
        ├── Product Table
        │     ├── Name | Price | Stock | Actions
        │     └── Empty state: "No products yet..."
        ├── Add Product Button
        ├── Product Form (create/edit)
        │     └── Fields: name, description, price, stock, imageUrl
        └── Delete Confirmation Dialog
```

State needed:
- `products` — from `useProductsQuery()` (already exists line 60)
- `editingProduct` — Product | null (which product is being edited)
- `showProductForm` — boolean
- `productFormError` — string | null

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | createProduct resolver | Test validation (price<=0, stock<0, missing name) |
| Unit | updateProduct resolver | Test partial update, "not found" |
| Unit | deleteProduct resolver | Test "not found", successful delete |
| Integration | Role enforcement | Verify STAFF works, unauthenticated fails |
| E2E | ControlPanel UI | Add product, edit product, delete product flows |

Follow existing test pattern in `__tests__/graphql/mutations/news.test.ts`.

## Migration / Rollout

No migration required. Products table already exists in schema.sql. Mutations are additive.

## Open Questions

None — spec fully defines scope.