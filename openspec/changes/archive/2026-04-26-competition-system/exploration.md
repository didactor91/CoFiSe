## Exploration: Competition System

### Current State

The CFS project currently has no competition/tournament functionality. Existing domains follow these patterns:

**GraphQL Schema** (`cfs/server/src/graphql/schema.ts`):
- Types defined with `gql` tag, inputs with `input` prefix
- Enums for status-like fields (`ReservationStatus`, `EntityType`)
- Relationships via ID fields (no joins), e.g., `productId: ID!`
- Queries split: public (`news`, `events`) and authenticated (`allNews`, `allEvents`)
- Mutations follow `createX`, `updateX`, `deleteX` naming

**Database Schema** (`cfs/database/schema.sql`):
- SQLite with better-sqlite3 (synchronous)
- FK via `REFERENCES table(id)`
- snake_case column names, camelCase in GraphQL
- Timestamps: `created_at`, `updated_at`
- Index naming: `idx_tablename_column`

**Admin CRUD Pattern** (`EventsPage.tsx`):
- Permission-gating via `can('resource.action')`
- Inline form with validation
- Table list with search filter
- ConfirmDialog for destructive actions
- urql hooks for GraphQL

**Module Pattern** (`modules/events/resolvers.ts`):
- Resolvers in `modules/{domain}/resolvers.ts`
- Guards in `modules/shared/guards.ts` (`requirePermission(ctx, 'X')`)
- Mappers in `modules/shared/mappers.ts` (`entityFromRow`)
- Direct SQL: `db.prepare(...).all()` / `.get()` / `.run()`

**Permissions** (`auth/permissions.ts`):
- Two roles: ADMIN (all), STAFF (subset)
- Format: `resource.action` (e.g., `event.create`)

---

### Affected Areas

- `cfs/database/schema.sql` — new tables for tournaments, participants, matches, rounds
- `cfs/database/migrations.ts` — migration v4 for competition tables
- `cfs/server/src/graphql/schema.ts` — new types, queries, mutations
- `cfs/server/src/graphql/resolvers.ts` — import and merge competitions resolvers
- `cfs/server/src/modules/competitions/resolvers.ts` — new domain resolver
- `cfs/server/src/modules/shared/guards.ts` — may need new guard variants
- `cfs/server/src/auth/permissions.ts` — new permissions (`competition.*`)
- `cfs/client/src/auth/permissions.ts` — mirror server permissions
- `cfs/client/src/pages/admin/CompetitionsPage.tsx` — admin CRUD page
- `cfs/client/src/App.tsx` — route for `/admin/competitions`
- `cfs/client/src/pages/admin/AdminLayout.tsx` — nav link with permission gate
- `cfs/packages/types/generated/graphql.ts` — generated types will include new GraphQL types

---

### Approaches

#### 1. **Self-Contained Competition Module**
Create `modules/competitions/` with full ownership of tournament data.

- **Pros**: Clean separation, easy to understand, aligns with existing module pattern
- **Cons**: Tournament participants are likely the same entities as Products/Teams — may duplicate data if Products are reused
- **Effort**: Medium

#### 2. **Competition as Event Extension**
Tournaments are a special Event type with complex sub-structure.

- **Pros**: Leverages existing event infrastructure, simpler admin UX
- **Cons**: Event model is simple time-bounded — tournament brackets need persistent structure; coupling risk
- **Effort**: High (schema mismatch requires creative mapping)

---

### Data Model Proposal

```
tournaments
  id, name, description, match_type (SINGLE_LEG | HOME_AND_AWAY),
  status (DRAFT | REGISTRATION | LIVE | COMPLETED),
  created_at, updated_at

participants
  id, tournament_id FK, name, seed (int nullable), created_at

rounds
  id, tournament_id FK, number (1=N, 2=Quarters, 3=Semis, 4=Final),
  name (e.g., "Final"), created_at

matches
  id, round_id FK, participant1_id FK nullable, participant2_id FK nullable,
  leg (1 or 2 for HOME_AND_AWAY), score1, score2,
  winner_id FK nullable, status (PENDING | IN_PROGRESS | COMPLETED),
  created_at, updated_at
```

**Match Type Behavior**:
- `SINGLE_LEG`: winner decided in one match
- `HOME_AND_AWAY`: two legs, aggregate score wins; if tie after 2 legs, goes to "away goals" or manual winner (admin can set `winner_id` directly)

**Bye Handling**:
- When `generateBracket()` called, if odd participant count, one gets bye
- Bye propagation: winner of odd match auto-advances
- Stored via `participant_id IS NULL` + `bye: true` flag on match

**Bracket Generation Algorithm** (seeded single-elimination):
1. Sort participants by seed (or random if unseeded)
2. If odd count, move last participant to next round with bye
3. Pair 1st vs last, 2nd vs second-last, etc.
4. Each round complete when all matches have winner_id
5. Next round auto-generated when previous round completes

---

### GraphQL API Proposal

```graphql
type Tournament {
  id: ID!
  name: String!
  description: String
  matchType: MatchType!
  status: TournamentStatus!
  participants: [Participant!]!
  rounds: [Round!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Participant {
  id: ID!
  name: String!
  seed: Int
}

type Round {
  id: ID!
  number: Int!
  name: String!
  matches: [Match!]!
}

type Match {
  id: ID!
  participant1: Participant
  participant2: Participant
  leg: Int
  score1: Int
  score2: Int
  winner: Participant
  status: MatchStatus!
  bye: Boolean!
}

enum MatchType { SINGLE_LEG HOME_AND_AWAY }
enum TournamentStatus { DRAFT REGISTRATION LIVE COMPLETED }
enum MatchStatus { PENDING IN_PROGRESS COMPLETED }

type Query {
  tournaments: [Tournament!]!           # public, upcoming
  tournament(id: ID!): Tournament     # public
  allTournaments: [Tournament!]!       # staff/admin
}

type Mutation {
  createTournament(input: CreateTournamentInput!): Tournament!
  updateTournament(id: ID!, input: UpdateTournamentInput!): Tournament!
  deleteTournament(id: ID!): Boolean!
  
  addParticipant(tournamentId: ID!, name: String!, seed: Int): Tournament!
  removeParticipant(tournamentId: ID!, participantId: ID!): Tournament!
  
  generateBracket(tournamentId: ID!): Tournament!  # creates rounds + matches
  
  updateMatchScore(id: ID!, score1: Int!, score2: Int!): Match!
  resolveMatch(id: ID!, winnerId: ID!): Match!     # manual winner on draw
}
```

---

### Admin Page Architecture

**CompetitionsPage.tsx** (Staff/Admin CRUD):
- List view: tournaments with status badges
- Create/Edit form: name, description, match type dropdown
- Tournament detail view: participant management, bracket visualization
- Bracket visualization: HTML/SVG bracket tree (rounds as columns, matches as rows)

**Public Bracket View** (`/tournaments/:id`):
- Read-only bracket display
- Real-time updates via polling (or GraphQL subscriptions if added)

---

### Permissions Required

```typescript
// In permissions.ts
| 'competition.read'
| 'competition.create'
| 'competition.update'
| 'competition.delete'
| 'competition.manage'
```

- ADMIN: all competition permissions
- STAFF: competition.read, competition.create, competition.update (no delete)

---

### Recommendation

**Approach 1: Self-Contained Competition Module** is recommended because:
1. Tournament bracket structure is fundamentally different from events (recursive rounds vs. simple datetime range)
2. Clean separation allows bracket algorithm to evolve independently
3. Participants may be Teams that could be reused, but that can be modeled as a separate entity initially
4. Follows existing module pattern exactly (resolvers + guards + mappers)

**Key Decision Points for Proposal**:
1. Are participants actual teams that exist elsewhere, or created per-tournament?
2. Is there a need for seeded tournaments (brackets always "correct") or random pairings?
3. HOME_AND_AWAY: need away goals rule or just aggregate + manual override?

---

### Risks

1. **Bracket algorithm complexity**: Generating correct brackets with bye handling has edge cases (bye in round 1 vs round 2, etc.) — needs thorough testing
2. **HOME_AND_AWAY scoring**: Aggregate calculation needs careful implementation; tiebreaker rules must be explicit
3. **Client bracket visualization**: Rendering dynamic brackets in React without a library is non-trivial; consider using an existing library or SVG-based approach
4. **Permission scoping**: Competitions may need their own permission hierarchy if different staff manage different tournaments

### Ready for Proposal

Yes. The data model, GraphQL API surface, and bracket algorithm are sufficiently understood. Clarification needed on:
- Are tournament participants "Teams" that exist as a separate entity, or just names created per-tournament?
- Is seeding required (yes/no)?
- For HOME_AND_AWAY: away goals tiebreaker (yes/no)?
