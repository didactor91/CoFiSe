# Proposal: events-system

## Intent

Seno-Com lacks a structured events system. Content managers cannot create, publish, or manage upcoming events through the admin panel. Visitors have no way to discover events on the public site. This change introduces a complete events CRUD system following the existing news-management pattern.

## Scope

### In Scope
- `events` database table with name, description, location, start_time, end_time
- GraphQL Event type with queries (list, getById) and mutations (create, update, delete)
- JWT permission guards for event.create, event.read, event.update, event.delete
- Admin panel section with event form + table in ControlPanel.tsx
- Public "Upcoming Events" section on Landing.tsx (list view)

### Out of Scope
- Calendar UI component (future enhancement)
- Recurring events support
- Event categories or tags
- RSVP or attendee management

## Capabilities

### New Capabilities
- `event-management`: Full CRUD for events accessible to STAFF/ADMIN roles; public read for upcoming events listing

### Modified Capabilities
- None

## Approach

Follow the news-management pattern exactly:

1. **Database**: Add `events` table to schema.sql with id, name, description, location, start_time, end_time, created_at, updated_at
2. **GraphQL Server**: Add Event type, Query.events, Mutation.createEvent, Mutation.updateEvent, Mutation.deleteEvent in schema.ts; implement resolvers with `eventFromRow()` helper in resolvers.ts
3. **Permissions**: Add event.* permissions in server/src/auth/permissions.ts; STAFF gets all event permissions
4. **GraphQL Client**: Add event queries and mutations in queries.ts/mutations.ts; sync event permissions in client auth
5. **Admin Panel**: Add Events section to ControlPanel.tsx with form inputs (name, description, location, datetime-local for start/end) and data table
6. **Public View**: Add Upcoming Events section to Landing.tsx showing next events ordered by start_time
7. Run graphql-codegen after schema changes

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `cfs/database/schema.sql` | Modified | Add events table |
| `cfs/server/src/graphql/schema.ts` | Modified | Add Event type, queries, mutations |
| `cfs/server/src/graphql/resolvers.ts` | Modified | Implement event CRUD resolvers |
| `cfs/server/src/auth/permissions.ts` | Modified | Add event permission guards |
| `cfs/client/src/graphql/queries.ts` | Modified | Add event queries |
| `cfs/client/src/graphql/mutations.ts` | Modified | Add event mutations |
| `cfs/client/src/auth/permissions.ts` | Modified | Sync event permissions |
| `cfs/client/src/pages/ControlPanel.tsx` | Modified | Add Events admin section |
| `cfs/client/src/pages/Landing.tsx` | Modified | Add Upcoming Events section |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| No date picker component | Medium | Use HTML5 datetime-local input; custom picker as future enhancement |
| graphql-codegen not run | High | Document as explicit dependency; verify on implementation |
| Schema changes break existing queries | Low | Test all existing GraphQL operations after schema update |

## Rollback Plan

1. Revert `schema.sql` to drop events table
2. Revert schema.ts and resolvers.ts to previous state
3. Revert permissions files
4. Revert client files
5. Re-run graphql-codegen to regenerate types

## Dependencies

- graphql-codegen must be run after schema changes (document in handoff)

## Success Criteria

- [ ] STAFF can create, edit, and list events from admin panel
- [ ] ADMIN can delete events from admin panel
- [ ] Public visitors see upcoming events on Landing page
- [ ] All permission guards enforced at resolver level
- [ ] graphql-codegen runs successfully after schema changes
