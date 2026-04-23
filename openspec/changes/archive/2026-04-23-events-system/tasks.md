# Tasks: Events System

## Phase 1: Database Foundation

- [x] 1.1 Add `events` table to `cfs/database/schema.sql` — columns: id, name, description, location, start_time, end_time, created_at, updated_at (mirror news table structure)
- [x] 1.2 Add index on `start_time` column for efficient upcoming events queries

## Phase 2: GraphQL Server

- [x] 2.1 Add Event type, CreateEventInput, UpdateEventInput to `cfs/server/src/graphql/schema.ts`
- [x] 2.2 Add queries: `events` (public upcoming), `event(id)` (public), `allEvents` (staff+)
- [x] 2.3 Add mutations: `createEvent` (STAFF+), `updateEvent` (STAFF+), `deleteEvent` (ADMIN only)
- [x] 2.4 Add `eventFromRow()` helper function in `cfs/server/src/graphql/resolvers.ts`
- [x] 2.5 Implement `events` query resolver — filter WHERE start_time >= now, ORDER BY start_time ASC
- [x] 2.6 Implement `event(id)` query resolver — return single event by ID
- [x] 2.7 Implement `createEvent` mutation resolver with validation
- [x] 2.8 Implement `updateEvent` mutation resolver with validation
- [x] 2.9 Implement `deleteEvent` mutation resolver (ADMIN only)
- [x] 2.10 Add event permissions to `cfs/server/src/auth/permissions.ts`: event.read=PUBLIC, event.create=STAFF+, event.update=STAFF+, event.delete=ADMIN

## Phase 3: GraphQL Client

- [x] 3.1 Add EVENTS_QUERY, EVENT_QUERY, ALL_EVENTS_QUERY to `cfs/client/src/graphql/queries.ts`
- [x] 3.2 Add CREATE_EVENT_MUTATION, UPDATE_EVENT_MUTATION, DELETE_EVENT_MUTATION to `cfs/client/src/graphql/mutations.ts`
- [x] 3.3 Sync event permissions to `cfs/client/src/auth/permissions.ts`
- [x] 3.4 Run `graphql-codegen` to regenerate types

## Phase 4: Admin Panel

- [x] 4.1 Add Events section to `cfs/client/src/pages/ControlPanel.tsx` with form and data table (follow conditional section pattern)
- [x] 4.2 Event form fields: name, description, location, start_time (datetime-local), end_time (datetime-local)
- [x] 4.3 Event table columns: name, location, start_time, actions (edit/delete)
- [x] 4.4 Implement create event form submission with validation
- [x] 4.5 Implement edit event pre-population and update flow
- [x] 4.6 Implement delete event with confirmation (ADMIN only)

## Phase 5: Public View

- [x] 5.1 Add "Próximos Eventos" section to `cfs/client/src/pages/Landing.tsx` (follow existing section pattern)
- [x] 5.2 Display upcoming events as simple list: name, date/time, location
- [x] 5.3 Connect to EVENTS_QUERY for public event listing

## Phase 6: Verification

- [x] 6.1 Verify STAFF can create event via admin panel (event.create permission)
- [x] 6.2 Verify STAFF can update event via admin panel (event.update permission)
- [x] 6.3 Verify STAFF cannot delete event (event.delete = ADMIN only)
- [x] 6.4 Verify ADMIN can delete event (event.delete = ADMIN)
- [x] 6.5 Verify public sees only upcoming events on Landing page (events query filters by start_time >= now)
- [x] 6.6 Verify public cannot access create/update/delete mutations (permission guards in resolvers)

### Implementation Order
Phase 1 (DB) first — all other phases depend on schema. Phase 2 (GraphQL Server) second — backend API for client. Phase 3 (GraphQL Client) third — generate types after server schema. Phase 4 (Admin) fourth — staff CRUD interface. Phase 5 (Public) fifth — visitor-facing view. Phase 6 (Verification) last — end-to-end validation.

### Phase Summary
| Phase | Tasks | Focus |
|-------|-------|-------|
| 1 | 2 | Database Foundation |
| 2 | 10 | GraphQL Server |
| 3 | 4 | GraphQL Client |
| 4 | 6 | Admin Panel |
| 5 | 3 | Public View |
| 6 | 6 | Verification |
| **Total** | **31** | |
