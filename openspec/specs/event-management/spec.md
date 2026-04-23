# Event Management Specification

## Purpose

The event-management domain provides CRUD operations for time-bound community events visible to both authenticated staff and public visitors.

## Requirements

### Requirement: Event Data Model

The system SHALL store events with the following fields:
- id: unique identifier (integer, auto-increment)
- name: event title (text, required, max 200 chars)
- description: event details (text, optional)
- location: event venue (text, required, max 300 chars)
- start_time: when event begins (datetime, required)
- end_time: when event ends (datetime, required)
- created_at: record creation timestamp
- updated_at: record modification timestamp

#### Scenario: Create event with all fields

- GIVEN the authenticated user has event.create permission
- WHEN the user submits a valid event with name, description, location, start_time, and end_time
- THEN the system creates the event record with generated id and timestamps
- AND returns the created event

#### Scenario: Reject event with missing required fields

- GIVEN the authenticated user has event.create permission
- WHEN the user submits an event with missing name or location
- THEN the system rejects the request with validation error

#### Scenario: Reject event with name exceeding 200 characters

- GIVEN the authenticated user has event.create permission
- WHEN the user submits an event with name at 201 characters
- THEN the system rejects with max length validation error

### Requirement: Public Event Listing

The system SHALL allow public (unauthenticated) users to list upcoming events ordered by start_time ascending.

#### Scenario: List upcoming events as public user

- GIVEN the system has events with start_time in the future
- WHEN a public user requests the events list
- THEN the system returns only events with start_time >= current time
- AND events are ordered by start_time ascending

#### Scenario: Return empty list when no upcoming events

- GIVEN the system has no events with start_time >= current time
- WHEN a public user requests the events list
- THEN the system returns an empty array

### Requirement: Admin Event Creation

The system SHALL allow authenticated STAFF and ADMIN users to create events.

#### Scenario: STAFF creates event successfully

- GIVEN the user is authenticated with STAFF role
- WHEN the STAFF user submits a valid create event request
- THEN the system creates the event and returns success

#### Scenario: Public user cannot create events

- GIVEN the user is not authenticated
- WHEN the user submits a create event request
- THEN the system returns authentication error

### Requirement: Admin Event Update

The system SHALL allow authenticated STAFF and ADMIN users to update existing events.

#### Scenario: STAFF updates event successfully

- GIVEN the user is authenticated with STAFF role
- AND an event with id exists
- WHEN the STAFF user submits a valid update request
- THEN the system updates the event and returns success

#### Scenario: Update non-existent event

- GIVEN the user is authenticated with STAFF role
- AND no event with the given id exists
- WHEN the STAFF user submits an update request
- THEN the system returns not found error

### Requirement: Admin Event Deletion

The system SHALL allow only ADMIN users to delete events.

#### Scenario: ADMIN deletes event successfully

- GIVEN the user is authenticated with ADMIN role
- AND an event with the given id exists
- WHEN the ADMIN user submits a delete request
- THEN the system removes the event and returns success

#### Scenario: STAFF cannot delete events

- GIVEN the user is authenticated with STAFF role
- AND an event with the given id exists
- WHEN the STAFF user submits a delete request
- THEN the system returns permission denied error

### Requirement: Event Validation

The system SHALL validate:
- name is not empty and max 200 characters
- location is not empty and max 300 characters
- start_time is a valid datetime
- end_time is after start_time

#### Scenario: Reject event where end_time is before start_time

- GIVEN the authenticated user has event.create permission
- WHEN the user submits an event with end_time earlier than start_time
- THEN the system rejects with validation error indicating end_time must be after start_time

#### Scenario: Reject event with invalid datetime format

- GIVEN the authenticated user has event.create permission
- WHEN the user submits an event with malformed start_time
- THEN the system rejects with invalid datetime format error

### Requirement: Admin UI — Event Management Section

The system SHALL provide an Events page at `/admin/events` accessible to STAFF and ADMIN users. The page MUST display an events list and event form. Event management behavior (validation, create, update, delete by ADMIN only) remains unchanged.

#### Scenario: Events list display

- GIVEN an authenticated staff/admin user viewing the Events page at `/admin/events`
- WHEN the page loads
- THEN a list displays all events with name, location, start/end times, and action buttons
- AND only ADMIN users see Delete buttons

#### Scenario: Create event flow

- GIVEN an authenticated staff/admin user on the Events page
- WHEN the user clicks "Añadir Evento"
- THEN an event form appears with fields: Name (required, max 200 chars), Description (optional), Location (required, max 300 chars), Start Time (required), End Time (required, must be after start time)
- AND "Guardar" calls `createEvent` mutation

#### Scenario: Edit event flow

- GIVEN an authenticated staff/admin user on the Events page
- WHEN the user clicks "Edit" on an event row
- THEN the event form pre-fills with existing values
- AND "Guardar" calls `updateEvent` mutation

#### Scenario: Delete event (ADMIN only)

- GIVEN an authenticated ADMIN user on the Events page
- WHEN the user clicks "Delete" on an event row
- THEN a confirmation dialog appears
- AND on confirm, `deleteEvent` mutation is called

- GIVEN an authenticated STAFF user on the Events page
- WHEN the page renders
- THEN no Delete buttons are displayed for any events

#### Scenario: Empty events list

- GIVEN an authenticated staff/admin user on the Events page with no events
- THEN the page shows: "No hay eventos. Haz clic en 'Añadir Evento' para crear uno."

## Requirements (from control-panel-restructuring change, archived 2026-04-24)

Admin UI updated: Events page now accessible at `/admin/events` via page-based structure (previously part of monolithic ControlPanel)