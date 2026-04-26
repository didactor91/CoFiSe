# Spec: file-upload

## Purpose

Provides a GraphQL multipart file upload mutation for staff/admin users to upload images for products, news, and events.

## Requirements

### Requirement: uploadImage Mutation

The system SHALL provide an `uploadImage` mutation accepting multipart form data with entityType, entityId, and file.

#### Scenario: Successful image upload

- GIVEN an authenticated STAFF/ADMIN user with valid entityType ("PRODUCT" | "NEWS" | "EVENT"), existing entityId, and valid image file (JPEG/PNG/GIF/WebP <= 5MB)
- WHEN `uploadImage(entityType: EntityType!, entityId: ID!, file: Upload!)` is called
- THEN the file is stored in local uploads/ directory with UUID filename preserving extension
- AND entity's imageUrl field is updated to `/uploads/{uuid}.{ext}`
- AND the updated entity is returned

#### Scenario: Upload to product

- GIVEN an authenticated STAFF/ADMIN user and a product with id "prod-123"
- WHEN `uploadImage(entityType: PRODUCT, entityId: "prod-123", file: image.png)` is called
- THEN product.imageUrl is set to "/uploads/{uuid}.png"
- AND product is returned

#### Scenario: Upload to news

- GIVEN an authenticated STAFF/ADMIN user and a news item with id "news-456"
- WHEN `uploadImage(entityType: NEWS, entityId: "news-456", file: image.jpg)` is called
- THEN news.imageUrl is set to "/uploads/{uuid}.jpg"
- AND news is returned

#### Scenario: Upload to event

- GIVEN an authenticated STAFF/ADMIN user and an event with id "evt-789"
- WHEN `uploadImage(entityType: EVENT, entityId: "evt-789", file: image.webp)` is called
- THEN event.imageUrl is set to "/uploads/{uuid}.webp"
- AND event is returned

### Requirement: File Type Validation

The system MUST reject files with MIME types outside: image/jpeg, image/png, image/gif, image/webp.

#### Scenario: Reject invalid MIME type

- GIVEN an authenticated STAFF/ADMIN user uploading a .pdf file
- WHEN `uploadImage` is called with file having MIME type application/pdf
- THEN a validation error "Invalid file type. Allowed: JPEG, PNG, GIF, WebP" is thrown

#### Scenario: Reject executable disguised as image

- GIVEN an authenticated STAFF/ADMIN user uploading a file named image.jpg but content-type application/octet-stream
- WHEN `uploadImage` is called
- THEN a validation error is thrown

### Requirement: File Size Limit

The system MUST reject files exceeding 5MB (5,242,880 bytes).

#### Scenario: Reject oversized file

- GIVEN an authenticated STAFF/ADMIN user uploading a 6MB file
- WHEN `uploadImage` is called
- THEN a validation error "File size exceeds 5MB limit" is thrown

#### Scenario: Accept exactly 5MB file

- GIVEN an authenticated STAFF/ADMIN user uploading a file exactly 5,242,880 bytes
- WHEN `uploadImage` is called
- THEN upload succeeds

### Requirement: Authorization

The system MUST restrict uploadImage mutation to STAFF and ADMIN roles only.

#### Scenario: Unauthenticated user cannot upload

- GIVEN no authentication token
- WHEN `uploadImage` is called
- THEN an "Unauthorized" error is thrown

#### Scenario: Regular user cannot upload

- GIVEN an authenticated user with role USER
- WHEN `uploadImage` is called
- THEN an "Insufficient permissions" error is thrown

### Requirement: Error Handling

The system SHALL provide descriptive errors for failure cases.

#### Scenario: Upload to non-existent entity

- GIVEN an authenticated STAFF/ADMIN user uploading to entityType PRODUCT with entityId that does not exist
- WHEN `uploadImage` is called
- THEN a "Product not found" error is thrown

#### Scenario: Invalid entityType

- GIVEN an authenticated STAFF/ADMIN user with entityType "INVALID"
- WHEN `uploadImage` is called
- THEN a validation error "entityType must be PRODUCT, NEWS, or EVENT" is thrown

## GraphQL Schema

```graphql
enum EntityType {
  PRODUCT
  NEWS
  EVENT
}

type Mutation {
  uploadImage(entityType: EntityType!, entityId: ID!, file: Upload!): ImageUploadResult!
}

union ImageUploadResult = Product | News | Event

type ImageUploadPayload {
  success: Boolean!
  imageUrl: String
  entity: ImageUploadResult
}
```

## UI Component

### ImageUpload Component

| Prop | Type | Description |
|------|------|-------------|
| entityType | "PRODUCT" \| "NEWS" \| "EVENT" | Target entity type |
| entityId | string | Target entity ID |
| onUploadComplete | (imageUrl: string) => void | Callback after successful upload |
| currentImageUrl | string | Optional: show current image preview |

| State | Description |
|-------|-------------|
| idle | No upload in progress |
| uploading | Progress indicator shown |
| success | Checkmark, new image URL displayed |
| error | Error message displayed, retry available |

## Acceptance Criteria

1. Staff/admin can upload JPEG, PNG, GIF, WebP images up to 5MB
2. Files are stored locally with UUID names preserving extension
3. Entity.imageUrl is updated to /uploads/{uuid}.{ext}
4. Public users cannot upload
5. Invalid types/sizes produce descriptive errors