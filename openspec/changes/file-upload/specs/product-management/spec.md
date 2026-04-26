# Delta Spec: product-management (file-upload change)

## Changes Applied

This delta modifies the product-management/spec.md to change imageUrl from text input to file upload.

## MODIFY: Product Data Model — imageUrl field

The Product type imageUrl field remains, but input method changes from text URL to file upload.

## MODIFY: CreateProductInput

```graphql
input CreateProductInput {
  name: String!
  description: String!
  price: Float!
  stock: Int!
  imageUrl: String  # REMOVED as direct input — set via uploadImage mutation
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| imageUrl | String | No | Set by uploadImage mutation, NOT via text input |

**CHANGE**: imageUrl is still returned on Product type, but CreateProductInput no longer accepts it directly. Use `uploadImage(entityType: PRODUCT, entityId: $id, file: $file)` after creation.

## MODIFY: UpdateProductInput

```graphql
input UpdateProductInput {
  name: String
  description: String
  price: Float
  stock: Int
  imageUrl: String  # REMOVED as direct input — use uploadImage mutation
}
```

**CHANGE**: imageUrl removed from UpdateProductInput. Use `uploadImage(entityType: PRODUCT, entityId: $id, file: $file)` to change product image.

## MODIFY: Admin UI — Product Form

The product form SHALL replace the imageUrl text input with an ImageUpload component.

### Product Form Changes

| Field | Old Type | New Type | Notes |
|-------|----------|----------|-------|
| Image URL | text input | ImageUpload component | entityType="PRODUCT", handles upload automatically |

#### Scenario: Product form image upload

- GIVEN authenticated staff/admin on product create/edit form
- WHEN the form renders
- THEN ImageUpload component displays instead of text input for image
- AND current image shows preview if exists
- AND no text field for imageUrl is displayed

#### Scenario: Upload completes before save

- GIVEN staff/admin uploads an image for product
- WHEN the upload completes successfully
- THEN the form stores the returned imageUrl internally
- AND on "Guardar", the product is created/updated without separate imageUrl input

## REMOVE: Input Validation — Image URL

The following validation scenarios are REMOVED:
- "Image URL must be valid URL format"

## ADD: Scenarios for File Upload

### Scenario: Upload image to product

- GIVEN authenticated STAFF/ADMIN and existing product with id "prod-123"
- WHEN `uploadImage(entityType: PRODUCT, entityId: "prod-123", file: image.jpg)` is called
- THEN product.imageUrl is set to "/uploads/{uuid}.jpg"
- AND the updated product is returned

### Scenario: Product detail displays uploaded image

- GIVEN a product with imageUrl "/uploads/abc.jpg"
- WHEN user views `/products/:id`
- THEN the product image displays above price

## GraphQL Changes

```graphql
# REMOVED from CreateProductInput: imageUrl: String
# REMOVED from UpdateProductInput: imageUrl: String

# NEW: Use uploadImage mutation instead
mutation UploadProductImage($id: ID!, $file: Upload!) {
  uploadImage(entityType: PRODUCT, entityId: $id, file: $file) {
    ... on Product {
      id
      imageUrl
    }
  }
}
```

## Acceptance Criteria

1. CreateProductInput no longer accepts imageUrl (uploadImage used instead)
2. UpdateProductInput no longer accepts imageUrl (uploadImage used instead)
3. Admin form uses ImageUpload component with preview
4. Product image is uploaded via uploadImage mutation
5. ProductDetail displays uploaded image