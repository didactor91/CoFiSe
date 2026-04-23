# Spec: news-management

## Requirements (from news-crud change, archived 2026-04-23)

### Requirement: createNews Mutation

The system SHALL allow STAFF and ADMIN roles to create a news item via the `createNews` mutation. The mutation MUST accept `CreateNewsInput` and return the created `News` type.

#### Scenario: Successful news creation

- GIVEN an authenticated staff/admin user with valid input (title, content, optional imageUrl)
- WHEN `createNews(input: CreateNewsInput!)` is called
- THEN the news item is inserted into the database with generated id and timestamps
- AND the full `News` object is returned

#### Scenario: Create news with optional imageUrl

- GIVEN an authenticated staff/admin user providing title, content, and imageUrl
- WHEN `createNews` is called with all fields
- THEN news is created with the provided imageUrl
- AND creation succeeds

#### Scenario: Create news without imageUrl

- GIVEN an authenticated staff/admin user providing only required fields (title, content)
- WHEN `createNews` is called without `imageUrl`
- THEN news is created with `imageUrl` set to `null`
- AND creation succeeds

#### Scenario: Title is required

- GIVEN an input with missing `title`
- WHEN `createNews` is called
- THEN the database NOT NULL constraint throws an error

#### Scenario: Content is required

- GIVEN an input with missing `content`
- WHEN `createNews` is called
- THEN the database NOT NULL constraint throws an error

#### Scenario: Unauthenticated user cannot create news

- GIVEN an unauthenticated user (no token)
- WHEN `createNews` is called
- THEN an "Unauthorized" error is thrown

### Requirement: updateNews Mutation

The system SHALL allow STAFF and ADMIN roles to update an existing news item via the `updateNews` mutation. The mutation MUST accept `id` and `UpdateNewsInput`, and return the updated `News` type. Partial updates are supported.

#### Scenario: Successful full update

- GIVEN an authenticated staff/admin user and a valid news `id`
- WHEN `updateNews(id: ID!, input: UpdateNewsInput!)` is called with title, content, and imageUrl
- THEN all provided fields are updated in the database
- AND `updatedAt` timestamp is refreshed
- AND the updated `News` is returned

#### Scenario: Partial update (title only)

- GIVEN an authenticated staff/admin user and a news item with existing values
- WHEN `updateNews` is called with only `title` in input
- THEN `title` is updated while `content` and `imageUrl` remain unchanged

#### Scenario: Partial update (content only)

- GIVEN an authenticated staff/admin user and a news item with existing values
- WHEN `updateNews` is called with only `content` in input
- THEN `content` is updated while `title` and `imageUrl` remain unchanged

#### Scenario: Update non-existent news

- GIVEN an authenticated staff/admin user and a news `id` that does not exist
- WHEN `updateNews` is called
- THEN a "News not found" error is thrown

#### Scenario: Unauthenticated update attempt

- GIVEN an unauthenticated user
- WHEN `updateNews` is called
- THEN an "Unauthorized" error is thrown

### Requirement: deleteNews Mutation

The system SHALL allow STAFF and ADMIN roles to delete a news item via the `deleteNews` mutation. The mutation MUST accept `id` and return `Boolean`.

#### Scenario: Successful deletion

- GIVEN an authenticated staff/admin user and a valid news `id`
- WHEN `deleteNews(id: ID!)` is called
- THEN the news row is removed from the database
- AND `true` is returned

#### Scenario: Delete non-existent news

- GIVEN an authenticated staff/admin user and a news `id` that does not exist
- WHEN `deleteNews` is called
- THEN a "News not found" error is thrown

#### Scenario: Unauthenticated delete attempt

- GIVEN an unauthenticated user
- WHEN `deleteNews` is called
- THEN an "Unauthorized" error is thrown

### Requirement: Role-Based Access Control

The system MUST enforce that news mutations are only accessible to STAFF and ADMIN roles.

#### Scenario: Public cannot access mutations

- GIVEN an unauthenticated request
- WHEN any of `createNews`, `updateNews`, `deleteNews` is called
- THEN an "Unauthorized" error is thrown before any validation

#### Scenario: Staff role can access all mutations

- GIVEN an authenticated user with role `STAFF`
- WHEN any news mutation is called
- THEN the operation succeeds (after validation)

#### Scenario: Admin role can access all mutations

- GIVEN an authenticated user with role `ADMIN`
- WHEN any news mutation is called
- THEN the operation succeeds (after validation)

### Requirement: Admin UI — News Management Section

The system SHALL provide a news management section within the ControlPanel accessible to STAFF and ADMIN users.

#### Scenario: News list display

- GIVEN an authenticated staff/admin user viewing the ControlPanel
- WHEN the news management section is loaded
- THEN a table displays all news items with columns: Title, Content preview, Image, Actions
- AND each row shows Edit and Delete buttons

#### Scenario: Create news form

- GIVEN an authenticated staff/admin user
- WHEN the user clicks "Add News" in the ControlPanel
- THEN a form appears with fields: Title (text), Content (textarea), Image URL (text, optional)
- AND a "Save" button to submit

#### Scenario: Edit news flow

- GIVEN an authenticated staff/admin user
- WHEN the user clicks "Edit" on a news row
- THEN the same form as create pre-fills with existing values
- AND "Save" updates the news via `updateNews` mutation

#### Scenario: Delete news confirmation

- GIVEN an authenticated staff/admin user
- WHEN the user clicks "Delete" on a news row
- THEN a confirmation dialog appears: "Delete news '{title}'? This cannot be undone."
- AND on confirm, `deleteNews` mutation is called

#### Scenario: Empty news list

- GIVEN an authenticated staff/admin user
- WHEN the news list is empty (no news in database)
- THEN the table shows: "No news yet. Click 'Add News' to create one."

#### Scenario: Content preview in list

- GIVEN a news item with long content
- WHEN the news list is displayed
- THEN only the first 100 characters of content are shown followed by "..."
- AND the full content is preserved in the database

### Requirement: Client Mutation Hooks

The client SHALL provide typed GraphQL mutation hooks for news operations.

#### Scenario: useCreateNewsMutation hook

- GIVEN the `CREATE_NEWS_MUTATION` GraphQL string
- WHEN `useCreateNewsMutation()` is called
- THEN it returns a urql `UseMutationResponse` for `CreateNewsMutationResult`
- AND the hook accepts `CreateNewsInput` as variables

#### Scenario: useUpdateNewsMutation hook

- GIVEN the `UPDATE_NEWS_MUTATION` GraphQL string
- WHEN `useUpdateNewsMutation()` is called
- THEN it returns a urql `UseMutationResponse` for `UpdateNewsMutationResult`
- AND the hook accepts `{ id: string, input: UpdateNewsInput }` as variables

#### Scenario: useDeleteNewsMutation hook

- GIVEN the `DELETE_NEWS_MUTATION` GraphQL string
- WHEN `useDeleteNewsMutation()` is called
- THEN it returns a urql `UseMutationResponse` for `DeleteNewsMutationResult`
- AND the hook accepts `{ id: string }` as variables

## GraphQL Schema Additions

```graphql
# Mutation strings (add to mutations.ts)
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

mutation DeleteNews($id: ID!) {
  deleteNews(id: $id)
}
```

## UI Component Specifications

### News List Table

| Column | Type | Notes |
|--------|------|-------|
| Title | string | Primary identifier |
| Content | string | Truncated to 100 chars with "..." |
| Image | thumbnail | Shows if imageUrl exists, placeholder otherwise |
| Actions | buttons | Edit (primary), Delete (danger) |

### News Form

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| Title | text input | non-empty | Yes |
| Content | textarea | non-empty | Yes |
| Image URL | text input | valid URL format (optional) | No |

### Delete Confirmation Dialog

- Title: "Delete News"
- Body: "Are you sure you want to delete '{newsTitle}'? This action cannot be undone."
- Buttons: "Cancel" (secondary), "Delete" (danger)
