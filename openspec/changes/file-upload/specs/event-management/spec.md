# Delta Spec: event-management (file-upload change)

## Changes Applied

This delta modifies the event-management/spec.md to add image upload capability.

## MODIFY: Event Data Model

### Event type — ADD imageUrl field

The Event type SHALL include an optional imageUrl field for event images.

#### Scenario: Event with image

- GIVEN a new event with imageUrl provided
- WHEN the event is created
- THEN imageUrl is stored and returned in queries

#### Scenario: Event without image

- GIVEN a new event without imageUrl
- WHEN the event is created
- THEN imageUrl is null

## MODIFY: CreateEventInput

```graphql
input CreateEventInput {
  name: String!
  description: String
  location: String!
  start_time: DateTime!
  end_time: DateTime!
  imageUrl: String  # ADDED — optional, set via file-upload mutation
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| imageUrl | String | No | Set by uploadImage mutation, not via text input |

## MODIFY: UpdateEventInput

```graphql
input UpdateEventInput {
  name: String
  description: String
  location: String
  start_time: DateTime
  end_time: DateTime
  imageUrl: String  # ADDED — modifiable via uploadImage mutation
}
```

## MODIFY: Admin UI — Event Form

The event form SHALL include an image upload component instead of text input for image.

| Field | Type | Component | Notes |
|-------|------|-----------|-------|
| Image | file | ImageUpload | entityType="EVENT", replaces imageUrl text input |

### Image Upload in Form

- GIVEN authenticated staff/admin creating/editing an event
- WHEN the form renders
- THEN an ImageUpload component appears with current imageUrl preview
- AND no text input for imageUrl is displayed

## MODIFY: EventDetail Page

### Event detail displays image

- GIVEN an event with imageUrl set to "/uploads/abc123.jpg"
- WHEN user views `/events/:id`
- THEN the image is displayed below description (if imageUrl exists)

## ADD: Scenarios for Image Upload

### Scenario: Upload image to event via mutation

- GIVEN an authenticated STAFF/ADMIN user and an existing event with id "evt-123"
- WHEN `uploadImage(entityType: EVENT, entityId: "evt-123", file: image.jpg)` is called
- THEN event.imageUrl is updated to "/uploads/{uuid}.jpg"
- AND the event is returned

### Scenario: Event detail shows image

- GIVEN an event exists with imageUrl "/uploads/test.jpg"
- WHEN user navigates to `/events/:id`
- THEN the event image displays at full width above description

## Acceptance Criteria

1. Event type includes imageUrl field (nullable String)
2. CreateEventInput accepts imageUrl via upload (not text)
3. UpdateEventInput allows imageUrl modification
4. Admin form uses ImageUpload component with preview
5. EventDetail displays image when imageUrl is set