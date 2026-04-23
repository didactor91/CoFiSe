# Design: Events System

## Technical Approach

Follow the established news-management pattern exactly for all layers: database table, GraphQL schema, resolvers with `eventFromRow()` helper, permission guards, client queries/mutations, admin form with inline editing, and public list view. Use HTML5 `datetime-local` inputs for start/end times. Run `graphql-codegen` after schema changes.

## Architecture Decisions

### Decision: Permission boundaries mirror news
**Choice**: `event.read` is PUBLIC, `event.create/update` require STAFF+, `event.delete` requires ADMIN only.
**Alternatives considered**: Making all mutations STAFF+ but delete ADMIN-only was rejected as inconsistent.
**Rationale**: Follows the existing permission matrix where STAFF can CRUD but only ADMIN can delete.

### Decision: Public endpoint returns only upcoming events
**Choice**: `events` query filters `WHERE start_time >= datetime('now')` with `ORDER BY start_time ASC`.
**Alternatives considered**: Returning all events with a past/future flag was rejected—client should only see what matters now.
**Rationale**: Public landing page needs "what's next" semantics, not an archive.

### Decision: No custom date picker
**Choice**: Use native `datetime-local` input type for start/end time fields.
**Alternatives considered**: Third-party calendar component was rejected per proposal out-of-scope.
**Rationale**: Native inputs are functional, accessible, and require zero dependencies.

## Data Flow

```
Public User                    Staff/Admin User                  GraphQL Server
     |                               |                               |
     |-- events query -------------->|                               |
     |                               |                               |-- db query (WHERE start_time >= now)
     |                               |                               |-- return Event[]
     |<-- Event[] -------------------|                               |
     |                               |                               |
     |                      |-- createEvent mutation ---------------->|
     |                      |                                       |-- validate input
     |                      |                                       |-- INSERT INTO events
     |                      |<-- Event (created) --------------------|
     |                               |                               |
     |                      |-- updateEvent mutation ---------------->|
     |                      |                                       |-- check exists
     |                      |                                       |-- UPDATE events SET ...
     |                      |<-- Event (updated) --------------------|
     |                               |                               |
     |                      |-- deleteEvent (ADMIN only) ----------->|
     |                      |                                       |-- DELETE FROM events
     |                      |<-- true -------------------------------|
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `cfs/database/schema.sql` | Modify | Add `events` table with id, name, description, location, start_time, end_time, created_at, updated_at; add index on start_time |
| `cfs/server/src/graphql/schema.ts` | Modify | Add Event type, CreateEventInput, UpdateEventInput, Query.events (public upcoming), Query.event (public by id), Mutation.createEvent, Mutation.updateEvent, Mutation.deleteEvent |
| `cfs/server/src/graphql/resolvers.ts` | Modify | Add `eventFromRow()` helper, implement Query.events (filtered by upcoming), Query.event, Mutation.createEvent, Mutation.updateEvent, Mutation.deleteEvent |
| `cfs/server/src/auth/permissions.ts` | Modify | Add `event.read`, `event.create`, `event.update`, `event.delete` permissions; assign to ADMIN and STAFF roles |
| `cfs/client/src/graphql/queries.ts` | Modify | Add EVENTS_QUERY (public upcoming), EVENT_QUERY (single by id) |
| `cfs/client/src/graphql/mutations.ts` | Modify | Add CREATE_EVENT_MUTATION, UPDATE_EVENT_MUTATION, DELETE_EVENT_MUTATION |
| `cfs/client/src/auth/permissions.ts` | Modify | Sync event permissions to match server |
| `cfs/client/src/pages/ControlPanel.tsx` | Modify | Add Events section with form (name, description, location, datetime-local for start/end) and data table with edit/delete actions |
| `cfs/client/src/pages/Landing.tsx` | Modify | Add "Próximos Eventos" section showing upcoming events in a simple list |

## GraphQL Schema

```graphql
type Event {
  id: ID!
  name: String!
  description: String
  location: String!
  startTime: DateTime!
  endTime: DateTime!
  createdAt: DateTime!
  updatedAt: DateTime!
}

input CreateEventInput {
  name: String!
  description: String
  location: String!
  startTime: DateTime!
  endTime: DateTime!
}

input UpdateEventInput {
  name: String
  description: String
  location: String
  startTime: DateTime
  endTime: DateTime
}

type Query {
  # Public - upcoming events only, ordered by start time
  events: [Event!]!
  event(id: ID!): Event

  # Staff+ (internal use for admin panel)
  allEvents: [Event!]!
}

type Mutation {
  createEvent(input: CreateEventInput!): Event!   # STAFF+
  updateEvent(id: ID!, input: UpdateEventInput!): Event!  # STAFF+
  deleteEvent(id: ID!): Boolean!  # ADMIN only
}
```

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Unit | `eventFromRow()` helper, permission checks | Direct function calls with mocked db rows |
| Integration | Resolver queries/mutations with real DB | Test with `better-sqlite3` in-memory |
| E2E | Admin creates/updates/deletes event; public sees upcoming | Playwright tests simulating both roles |

## Open Questions

- None