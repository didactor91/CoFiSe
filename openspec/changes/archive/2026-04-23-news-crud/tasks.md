# Tasks: news-crud

## Phase 1: Client Mutations (mutations.ts)

- [x] 1.1 Import `CreateNewsInput`, `UpdateNewsInput`, `CreateNewsMutationResult`, `UpdateNewsMutationResult`, `DeleteNewsMutationResult` types in `cfs/client/src/graphql/mutations.ts`
- [x] 1.2 Add `CREATE_NEWS_MUTATION` GraphQL string (matching Product pattern, lines 67-80 of mutations.ts)
- [x] 1.3 Add `UPDATE_NEWS_MUTATION` GraphQL string (matching Product pattern)
- [x] 1.4 Add `DELETE_NEWS_MUTATION` GraphQL string (matching Product pattern, line 97-100)
- [x] 1.5 Add `useCreateNewsMutation()` hook following `useCreateProductMutation` pattern (lines 119-121)
- [x] 1.6 Add `useUpdateNewsMutation()` hook following `useUpdateProductMutation` pattern (lines 123-125)
- [x] 1.7 Add `useDeleteNewsMutation()` hook following `useDeleteProductMutation` pattern (lines 127-129)

## Phase 2: Admin UI - News Management (ControlPanel.tsx)

- [x] 2.1 Add state variables: `showNewsForm` (boolean), `editingNews` (News | null), `newsForm` ({ title, content, imageUrl }), `newsFormError` (string | null), `deleteConfirm` (string | null) — mirror Product state pattern (lines 59-70)
- [x] 2.2 Import `useCreateNewsMutation`, `useUpdateNewsMutation`, `useDeleteNewsMutation` from mutations (update line 4 import)
- [x] 2.3 Add News mutation hook destructuring: `[, createNewsMutation]`, `[, updateNewsMutation]`, `[, deleteNewsMutation]` — match Product pattern (line 81-83)
- [x] 2.4 Add "Gestión de Noticias" section header with "Añadir Noticia" button, placed after Product Management section (after line 942)
- [x] 2.5 Add news form with fields: Title (text, required), Content (textarea, required), Image URL (text, optional) — mirror Product form styling (lines 642-808)
- [x] 2.6 Wire form submit to `createNewsMutation` (create mode) or `updateNewsMutation` (edit mode) — match `handleProductFormSubmit` pattern (lines 161-223)
- [x] 2.7 Add Edit button per news row that pre-fills form with `editingNews` — match `handleEditProduct` pattern (lines 148-159)
- [x] 2.8 Add Delete button per news row wired to `deleteConfirm` state — match `handleDeleteProductClick` pattern (lines 225-227)
- [x] 2.9 Add delete confirmation dialog wired to `deleteNewsMutation` — match `handleConfirmDelete`/`handleCancelDelete` pattern (lines 229-245)
- [x] 2.10 Add news list table with columns: Title, Content preview (100 chars + "..."), Image, Actions — match Product table pattern (lines 861-940)
- [x] 2.11 Add empty state: "No hay noticias aún. Haz clic en 'Añadir Noticia' para crear una." — match Product empty state (line 871-872)

## Phase 3: Testing

- [x] 3.1 Add news CRUD integration tests in `client/src/__tests__/graphql/mutations.test.ts` (5 tests added for news mutation hooks)
- [ ] 3.2 Add E2E news management tests in `client/e2e/admin.spec.ts` covering: create news form, edit news flow, delete confirmation dialog, empty state display

## Implementation Order

1. **Phase 1 first**: mutations.ts hooks are dependencies for ControlPanel
2. **Phase 2 second**: UI depends on hooks existing
3. **Phase 3 last**: tests verify the implemented features
