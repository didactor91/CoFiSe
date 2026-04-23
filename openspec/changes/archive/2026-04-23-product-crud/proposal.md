# Proposal: product-crud

## Intent

Enable full CRUD operations for products via the admin panel. Currently only read queries exist (`products`, `product`) — staff/admin users cannot create, update, or delete products. This change adds the missing mutations following the established News CRUD pattern.

## Scope

### In Scope
- GraphQL schema mutations: `createProduct`, `updateProduct`, `deleteProduct`
- GraphQL input types: `CreateProductInput`, `UpdateProductInput`
- Resolver implementations with role enforcement (STAFF+)
- Admin UI section in ControlPanel for product management (list, create, edit, delete)
- Generated TypeScript types via codegen

### Out of Scope
- Public-facing product creation (not a requirement)
- Bulk operations or imports
- Product image upload to storage (URL only)

## Capabilities

### New Capabilities
- `product-management`: Full create/read/update/delete for products accessible by STAFF and ADMIN roles

### Modified Capabilities
- None

## Approach

Follow the existing News CRUD pattern (lines 259–309 in `resolvers.ts`) for consistency:
1. Add input types and mutations to GraphQL schema
2. Implement resolvers with `requireStaff(ctx)` guard
3. Add UI section in ControlPanel.tsx with create form and list with edit/delete actions
4. Add unit/integration tests for mutations

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `cfs/server/src/graphql/schema.ts` | Modified | Add `CreateProductInput`, `UpdateProductInput` types; `createProduct`, `updateProduct`, `deleteProduct` mutations |
| `cfs/server/src/graphql/resolvers.ts` | Modified | Implement mutation resolvers; reuse `productFromRow()` helper |
| `cfs/client/src/graphql/generated-types.ts` | Modified | Auto-generated via codegen |
| `cfs/client/src/graphql/mutations/` | Modified | Generate hooks via codegen |
| `cfs/client/src/pages/ControlPanel.tsx` | Modified | Add product management UI section (create form + list with actions) |
| `cfs/server/src/__tests__/graphql/mutations/` | New | Add product mutation tests |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Stock validation on delete ( orphaned reservations) | Low | Document in specs; soft delete considered future work |
| codegen not run post-schema change | Medium | Add codegen to verify step in tasks.md |
| Breaking existing queries/resolvers | Low | Product type unchanged; only additive mutations |

## Rollback Plan

1. Revert schema.ts changes (remove mutations + input types)
2. Revert resolvers.ts changes (remove Mutation handlers)
3. Revert ControlPanel.tsx changes (remove product management UI)
4. Run `pnpm codegen` to regenerate types
5. Revert test files if no other changes depend on them

## Dependencies

- GraphQL codegen (`pnpm codegen`) must be run after schema changes
- News CRUD pattern in codebase (reference implementation)

## Success Criteria

- [ ] `createProduct` mutation creates product in database
- [ ] `updateProduct` mutation updates product fields
- [ ] `deleteProduct` mutation removes product from database
- [ ] Role enforcement: mutations require STAFF or ADMIN (public fails with "Unauthorized"/"Insufficient permissions")
- [ ] Admin UI: form to create product with name, description, price, stock, imageUrl fields
- [ ] Admin UI: list displays products with edit and delete actions
- [ ] All mutation tests pass (existing news tests as template)
