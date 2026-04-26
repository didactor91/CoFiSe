# Delta Spec: news-management (file-upload change)

## Changes Applied

This delta modifies the news-management/spec.md to change imageUrl from text input to file upload.

## MODIFY: News Data Model — imageUrl field

The News type imageUrl field remains, but input method changes from text URL to file upload.

## MODIFY: CreateNewsInput

```graphql
input CreateNewsInput {
  title: String!
  content: String!
  imageUrl: String  # REMOVED as direct input — set via uploadImage mutation
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| imageUrl | String | No | Set by uploadImage mutation, NOT via text input |

**CHANGE**: imageUrl is still returned on News type, but CreateNewsInput no longer accepts it directly. Use `uploadImage(entityType: NEWS, entityId: $id, file: $file)` after creation.

## MODIFY: UpdateNewsInput

```graphql
input UpdateNewsInput {
  title: String
  content: String
  imageUrl: String  # REMOVED as direct input — use uploadImage mutation
}
```

**CHANGE**: imageUrl removed from UpdateNewsInput. Use `uploadImage(entityType: NEWS, entityId: $id, file: $file)` to change news image.

## MODIFY: Admin UI — News Form

The news form SHALL replace the imageUrl text input with an ImageUpload component.

### News Form Changes

| Field | Old Type | New Type | Notes |
|-------|----------|----------|-------|
| Image URL | text input | ImageUpload component | entityType="NEWS", handles upload automatically |

#### Scenario: News form image upload

- GIVEN authenticated staff/admin on news create/edit form
- WHEN the form renders
- THEN ImageUpload component displays instead of text input for image
- AND current image shows preview if exists
- AND no text field for imageUrl is displayed

#### Scenario: Upload completes before save

- GIVEN staff/admin uploads an image for news
- WHEN the upload completes successfully
- THEN the form stores the returned imageUrl internally
- AND on "Guardar", the news is created/updated without separate imageUrl input

## REMOVE: Input Validation — Image URL

The following validation scenarios are REMOVED:
- "Image URL must be valid URL format"

## ADD: Scenarios for File Upload

### Scenario: Upload image to news

- GIVEN authenticated STAFF/ADMIN and existing news with id "news-123"
- WHEN `uploadImage(entityType: NEWS, entityId: "news-123", file: image.jpg)` is called
- THEN news.imageUrl is set to "/uploads/{uuid}.jpg"
- AND the updated news is returned

### Scenario: News detail displays uploaded image

- GIVEN a news item with imageUrl "/uploads/abc.jpg"
- WHEN user views `/news/:id`
- THEN the news image displays as full-width header image

## GraphQL Changes

```graphql
# REMOVED from CreateNewsInput: imageUrl: String
# REMOVED from UpdateNewsInput: imageUrl: String

# NEW: Use uploadImage mutation instead
mutation UploadNewsImage($id: ID!, $file: Upload!) {
  uploadImage(entityType: NEWS, entityId: $id, file: $file) {
    ... on News {
      id
      imageUrl
    }
  }
}
```

## Acceptance Criteria

1. CreateNewsInput no longer accepts imageUrl (uploadImage used instead)
2. UpdateNewsInput no longer accepts imageUrl (uploadImage used instead)
3. Admin form uses ImageUpload component with preview
4. News image is uploaded via uploadImage mutation
5. NewsDetail displays uploaded image