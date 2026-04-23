# Tasks: product-crud

## Phase 1: Schema (Backend)

- [x] 1.1 Add `CreateProductInput` input type to `cfs/server/src/graphql/schema.ts` (name, description, price, stock, imageUrl)
- [x] 1.2 Add `UpdateProductInput` input type to `cfs/server/src/graphql/schema.ts` (all fields optional)
- [x] 1.3 Add `createProduct`, `updateProduct`, `deleteProduct` mutations to Mutation type in schema.ts

## Phase 2: Resolvers (Backend)

- [x] 2.1 Add `createProduct` resolver to `cfs/server/src/graphql/resolvers.ts` — requireStaff + validation (name required, price > 0, stock >= 0, name <= 500 chars) + INSERT
- [x] 2.2 Add `updateProduct` resolver — requireStaff + check exists + partial update with ?? pattern + validation
- [x] 2.3 Add `deleteProduct` resolver — requireStaff + check exists + DELETE + return true

## Phase 3: Client Mutations (Frontend)

- [x] 3.1 Add `CreateProductInput`, `UpdateProductInput` interfaces to `cfs/client/src/graphql/generated-types.ts`
- [x] 3.2 Add `CreateProductMutationResult`, `UpdateProductMutationResult`, `DeleteProductMutationResult` to generated-types.ts
- [x] 3.3 Add `CREATE_PRODUCT_MUTATION`, `UPDATE_PRODUCT_MUTATION`, `DELETE_PRODUCT_MUTATION` GraphQL strings to `cfs/client/src/graphql/mutations.ts`
- [x] 3.4 Add `useCreateProductMutation`, `useUpdateProductMutation`, `useDeleteProductMutation` hooks to mutations.ts

## Phase 4: Admin UI (Frontend)

- [x] 4.1 Add product state (editingProduct, showProductForm, productFormError) to ControlPanel.tsx
- [x] 4.2 Add Product Management section with table (Name, Price, Stock, Actions columns) below User Management
- [x] 4.3 Add Add Product button and form with fields: name, description, price, stock, imageUrl
- [x] 4.4 Wire form to useCreateProductMutation (create) and useUpdateProductMutation (edit)
- [x] 4.5 Add Edit button per row — pre-fills form with existing product
- [x] 4.6 Add Delete button with confirmation dialog — wires to useDeleteProductMutation
- [x] 4.7 Add empty state: "No products yet. Click 'Add Product' to create one."
- [x] 4.8 Add stock=0 visual indicator (red text or "Out of stock" badge)

## Phase 5: Testing

- [x] 5.1 Write product.test.ts — test createProduct: validation errors (price<=0, stock<0, missing name, name>500)
- [x] 5.2 Write product.test.ts — test updateProduct: partial update, not found error
- [x] 5.3 Write product.test.ts — test deleteProduct: not found, successful delete
- [x] 5.4 Verify all 3 mutations reject unauthenticated requests (requireStaff coverage)