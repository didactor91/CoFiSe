# Design: news-crud

## Technical Approach

Implement News CRUD operations in the ControlPanel following the established Product Management pattern. Backend resolvers already exist with full auth enforcement (`requireStaff`). The frontend needs UI state, mutation hooks, and form/table components.

## Architecture Decisions

### Decision: Client-side state pattern for News management

**Choice**: Mirror the Product management state structure (form state, editing state, delete confirmation)  
**Alternatives considered**: Centralized store (overkill), inline form per row (complex)  
**Rationale**: The spec explicitly defines a form-based workflow. Product CRUD is already implemented with this pattern — consistency across admin sections reduces cognitive load.

### Decision: Mutation hooks following existing GraphQL convention

**Choice**: Export `CREATE_NEWS_MUTATION`, `UPDATE_NEWS_MUTATION`, `DELETE_NEWS_MUTATION` strings + `useCreateNewsMutation()`, `useUpdateNewsMutation()`, `useDeleteNewsMutation()` hooks  
**Alternatives considered**: Custom wrapper hooks (adds indirection), inline mutations (scatters GraphQL)  
**Rationale**: Pattern matches Product mutations exactly (lines 119-129 of `client/src/graphql/mutations.ts`). TypeScript types auto-generated from schema.

## Data Flow

```
News Form Submit
     │
     ▼
useCreateNewsMutation / useUpdateNewsMutation
     │
     ▼
GraphQL Mutation (urql client)
     │
     ▼
Server resolver (requireStaff auth check)
     │
     ▼
SQLite: INSERT/UPDATE news
     │
     ▼
Return News object
     │
     ▼
urql cache update → re-render list
```

```
Delete Button Click
     │
     ▼
setDeleteConfirm(newsId)
     │
     ▼
Delete Confirm Dialog renders
     │
     ▼
useDeleteNewsMutation({ id })
     │
     ▼
GraphQL Mutation → resolver → DELETE FROM news
     │
     ▼
Cache update → list re-renders
```

## Component Architecture (News Management Section)

**State variables** (added to ControlPanel):

| Variable | Type | Purpose |
|----------|------|---------|
| `showNewsForm` | `boolean` | Toggle form visibility |
| `editingNews` | `News \| null` | Current news being edited (null = create mode) |
| `newsForm` | `{ title, content, imageUrl }` | Form field values |
| `newsFormError` | `string \| null` | Validation/mutation error |
| `deleteConfirm` | `string \| null` | News ID pending deletion |

**Form fields**: Title (text), Content (textarea), Image URL (text, optional)

**Table columns**: Title | Content preview (100 chars + "...") | Image | Actions (Edit, Delete)

## Client Mutation Hooks

```typescript
// cfs/client/src/graphql/mutations.ts

export const CREATE_NEWS_MUTATION = `
  mutation CreateNews($input: CreateNewsInput!) {
    createNews(input: $input) {
      id
      title
      content
      imageUrl
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_NEWS_MUTATION = `
  mutation UpdateNews($id: ID!, $input: UpdateNewsInput!) {
    updateNews(id: $id, input: $input) {
      id
      title
      content
      imageUrl
      createdAt
      updatedAt
    }
  }
`

export const DELETE_NEWS_MUTATION = `
  mutation DeleteNews($id: ID!) {
    deleteNews(id: $id)
  }
`

export function useCreateNewsMutation(): UseMutationResponse<CreateNewsMutationResult> {
  return useMutation<CreateNewsMutationResult>(CREATE_NEWS_MUTATION)
}

export function useUpdateNewsMutation(): UseMutationResponse<UpdateNewsMutationResult> {
  return useMutation<UpdateNewsMutationResult>(UPDATE_NEWS_MUTATION)
}

export function useDeleteNewsMutation(): UseMutationResponse<DeleteNewsMutationResult> {
  return useMutation<DeleteNewsMutationResult>(DELETE_NEWS_MUTATION)
}
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `cfs/client/src/graphql/mutations.ts` | Modify | Add News mutation strings and hooks |
| `cfs/client/src/pages/ControlPanel.tsx` | Modify | Add News management section (state, form, table) |

## Differences from Product CRUD

| Aspect | Product | News |
|--------|---------|------|
| Form fields | name, description, price, stock, imageUrl | title, content, imageUrl |
| Price/Stock | Yes (numeric validation) | No (simpler) |
| Content field | textarea | textarea (same) |
| Table columns | Name, Precio, Stock, Acciones | Title, Content preview, Image, Acciones |
| Content preview | N/A | Truncate 100 chars with "..." |
| Validation | name required, price > 0, stock >= 0 | title required, content required |

## Open Questions

None — all details resolved in spec.

## Next Step

Ready for sdd-tasks.