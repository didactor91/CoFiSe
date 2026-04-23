# Proposal: news-crud

## Intent

Add client-side GraphQL mutation hooks and admin UI for News CRUD. The backend (schema + resolvers) already exists — this change exposes those operations to the frontend.

## Scope

### In Scope
- GraphQL mutation strings in `mutations.ts` (CREATE_NEWS_MUTATION, UPDATE_NEWS_MUTATION, DELETE_NEWS_MUTATION)
- Typed mutation hooks (useCreateNewsMutation, useUpdateNewsMutation, useDeleteNewsMutation)
- News Management section in ControlPanel.tsx (form + list with edit/delete)
- Delete confirmation dialog

### Out of Scope
- Backend schema/resolver changes (already done)
- Image upload to storage (URL only)
- News listing page for public users

## Capabilities

### New Capabilities
- `news-management`: Full create/read/update/delete for news accessible by STAFF and ADMIN roles via admin panel

### Modified Capabilities
- None

## Approach

Mirror the product-crud implementation pattern:
1. Add GraphQL mutation strings following existing conventions
2. Generate typed hooks via codegen
3. Add News Management section in ControlPanel.tsx with state management
4. Use existing Product Management section as template

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `client/src/graphql/mutations.ts` | Modified | Add news mutation strings and hooks |
| `client/src/graphql/generated-types.ts` | Modified | Auto-generated via codegen |
| `client/src/pages/ControlPanel.tsx` | Modified | Add news management UI section |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| codegen not run post-change | Low | Add to verify step |
| Inconsistent UI with product section | Low | Use product section as exact template |

## Rollback Plan

1. Revert mutations.ts changes (remove news mutations)
2. Revert ControlPanel.tsx changes (remove news UI)
3. Run `pnpm codegen` to clean up generated types

## Dependencies

- Backend News CRUD (already implemented)
- GraphQL codegen (`pnpm codegen`)
- Product CRUD pattern (reference implementation)

## Success Criteria

- [ ] CREATE_NEWS_MUTATION, UPDATE_NEWS_MUTATION, DELETE_NEWS_MUTATION strings defined
- [ ] useCreateNewsMutation, useUpdateNewsMutation, useDeleteNewsMutation hooks functional
- [ ] News Management section renders in ControlPanel
- [ ] Create form with title, content, imageUrl fields
- [ ] List displays news items with edit and delete buttons
- [ ] Delete confirmation dialog before removal
- [ ] Staff role enforcement (requireStaff guard already in resolvers)
