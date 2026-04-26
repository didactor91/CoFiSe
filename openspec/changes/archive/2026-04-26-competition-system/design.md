# Design: Competition System

## Technical Approach

Knockout tournament bracket system with single-leg and home-and-away match types. Participants are added via alias list, bracket generated with Fisher-Yates shuffle, bye handling for odd counts, and manual winner resolution for tied aggregates. Follows existing module pattern (`modules/competitions/`) with GraphQL API and admin CRUD page.

## Architecture Decisions

### Decision: Match Type Storage

**Choice**: Separate `home_score1`, `home_score2`, `away_score1`, `away_score2` columns  
**Alternatives**: JSON score object, single `score1`/`score2` with leg indicator  
**Rationale**: Direct aggregate calculation `(home_score1 + away_score2)` vs `(home_score2 + away_score1)` without JSON parsing. SQLite-friendly normalization.

### Decision: Bracket Position Algorithm

**Choice**: Standard bracket tree with position-based pairing  
**Alternatives**: Recursive bracket construction, bracket library  
**Rationale**: Predictable layout enables SVG rendering without library dependency. Position `i` pairs with `(n-1-i)` in round 1, subsequent rounds follow power-of-2 structure.

### Decision: Bye Handling

**Choice**: Participant with bye advances to round 2 position `floor(pos/2)` automatically  
**Alternatives**: Store bye as match with `participant2_id = NULL`  
**Rationale**: Cleaner — bye participants don't appear as matches, they're simply pre-populated in round 2. Visual distinction via dashed border in bracket.

### Decision: Winner Resolution for HOME_AND_AWAY

**Choice**: Aggregate auto-calculated, admin manually sets `winner_id` on tie  
**Alternatives**: Away goals rule, penalty kicks, automatic coin flip  
**Rationale**: Spanish-localized context — "Empate" (tie) requires human decision in competition context. No away goals rule per proposal.

## Data Flow

**Competition Creation**:
```
Admin → CompetitionsPage → createCompetition mutation
      → competitions table (status=DRAFT)
```

**Bracket Generation**:
```
Admin → generateBracket mutation
      → Fisher-Yates shuffle participants
      → Create matches for each round
      → Bye participants pre-populated in round 2
      → status=ACTIVE
```

**Result Entry**:
```
Admin → MatchResultModal → setMatchResult mutation
      → Update match with scores + winner_id
      → If winner determined and next match exists:
           → Auto-populate next match participant
      → If round complete:
           → Check if competition complete (one winner)
           → status=COMPLETED
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `cfs/database/migrations.ts` | Modify | Add migration v4: competitions, participants, matches tables |
| `cfs/database/schema.sql` | Modify | Add competitions, participants, matches table definitions |
| `cfs/server/src/graphql/schema.ts` | Modify | Add Competition, Participant, Match types + enums + operations |
| `cfs/server/src/graphql/resolvers.ts` | Modify | Import and merge competitionsResolvers |
| `cfs/server/src/modules/competitions/resolvers.ts` | Create | Full resolver implementation |
| `cfs/server/src/modules/shared/mappers.ts` | Modify | Add competitionFromRow, participantFromRow, matchFromRow |
| `cfs/server/src/auth/permissions.ts` | Modify | Add competition.* permissions |
| `cfs/client/src/pages/admin/CompetitionsPage.tsx` | Create | Admin CRUD + participant management + bracket preview |
| `cfs/client/src/pages/CompetitionDetail.tsx` | Create | Public SVG bracket visualization |
| `cfs/client/src/App.tsx` | Modify | Add /competitions/:id route |
| `cfs/client/src/pages/admin/AdminLayout.tsx` | Modify | Add "Competiciones" nav link |
| `cfs/client/src/graphql/generated-types.ts` | Regenerate | Include new GraphQL types |

## Database Schema

```sql
CREATE TABLE competitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    match_type TEXT NOT NULL CHECK(match_type IN ('SINGLE_LEG', 'HOME_AND_AWAY')),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'ACTIVE', 'COMPLETED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    competition_id INTEGER NOT NULL REFERENCES competitions(id),
    alias TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    competition_id INTEGER NOT NULL REFERENCES competitions(id),
    round INTEGER NOT NULL,
    position INTEGER NOT NULL,
    participant1_id INTEGER REFERENCES participants(id),
    participant2_id INTEGER REFERENCES participants(id),
    home_score1 INTEGER,
    home_score2 INTEGER,
    away_score1 INTEGER,
    away_score2 INTEGER,
    winner_id INTEGER REFERENCES participants(id),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'COMPLETED'))
);

CREATE INDEX idx_participants_competition ON participants(competition_id);
CREATE INDEX idx_matches_competition ON matches(competition_id);
CREATE INDEX idx_matches_round_position ON matches(competition_id, round, position);
```

## GraphQL Schema

```graphql
enum MatchType {
  SINGLE_LEG
  HOME_AND_AWAY
}

enum CompetitionStatus {
  DRAFT
  ACTIVE
  COMPLETED
}

enum MatchStatus {
  PENDING
  COMPLETED
}

type Competition {
  id: ID!
  name: String!
  description: String
  matchType: MatchType!
  status: CompetitionStatus!
  participants: [Participant!]!
  matches: [Match!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Participant {
  id: ID!
  competitionId: ID!
  alias: String!
  createdAt: DateTime!
}

type Match {
  id: ID!
  competitionId: ID!
  round: Int!
  position: Int!
  participant1: Participant
  participant2: Participant
  homeScore1: Int
  homeScore2: Int
  awayScore1: Int
  awayScore2: Int
  winner: Participant
  status: MatchStatus!
  isBye: Boolean!
}

type Query {
  # Public
  competitions: [Competition!]!
  competition(id: ID!): Competition
  
  # Admin
  allCompetitions: [Competition!]!
}

type Mutation {
  # Admin
  createCompetition(input: CreateCompetitionInput!): Competition!
  updateCompetition(id: ID!, input: UpdateCompetitionInput!): Competition!
  deleteCompetition(id: ID!): Boolean!
  addParticipants(competitionId: ID!, aliases: [String!]!): Competition!
  generateBracket(competitionId: ID!): Competition!
  setMatchResult(id: ID!, input: SetMatchResultInput!): Match!
}

input CreateCompetitionInput {
  name: String!
  description: String
  matchType: MatchType!
}

input UpdateCompetitionInput {
  name: String
  description: String
  matchType: MatchType
}

input SetMatchResultInput {
  homeScore1: Int
  homeScore2: Int
  awayScore1: Int
  awayScore2: Int
  winnerId: ID
}
```

## Bracket Generation Algorithm

```typescript
function generateBracket(competitionId: number): void {
  const participants = db.prepare(
    `SELECT * FROM participants WHERE competition_id = ? ORDER BY id`
  ).all(competitionId);
  
  // Fisher-Yates shuffle
  for (let i = participants.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [participants[i], participants[j]] = [participants[j], participants[i]];
  }
  
  const n = participants.length;
  let participantsWithBye = null;
  
  // Handle odd count - last participant gets bye
  if (n % 2 === 1) {
    participantsWithBye = participants.pop();
  }
  
  const rounds = Math.ceil(Math.log2(n));
  
  // Create matches for each round
  for (let round = 1; round <= rounds; round++) {
    const matchesInRound = Math.pow(2, rounds - round);
    
    for (let pos = 0; pos < matchesInRound; pos++) {
      if (round === 1) {
        // Round 1: pair participants[i] with participants[n-1-i]
        const p1Index = pos;
        const p2Index = matchesInRound * 2 - 1 - pos;
        
        if (p1Index < participants.length && p2Index < participants.length) {
          createMatch(competitionId, round, pos, 
            participants[p1Index].id, participants[p2Index].id);
        } else if (p1Index < participants.length) {
          // Bye - advance participant directly
          advanceParticipant(participants[p1Index].id, round + 1, pos * 2);
        }
      } else {
        // Subsequent rounds: winners from previous round
        const p1 = getParticipant(round, pos, true);
        const p2 = getParticipant(round, pos, false);
        
        if (p1 && p2) {
          createMatch(competitionId, round, pos, p1, p2);
        } else if (p1) {
          advanceParticipant(p1, round + 1, pos * 2);
        }
      }
    }
  }
}
```

## Frontend Architecture

### Admin: CompetitionsPage.tsx

**State**:
- `competitions: Competition[]` — list from `allCompetitions` query
- `selectedCompetition: Competition | null` — for detail view
- `showForm: boolean` — create/edit modal
- `participants: string[]` — alias list for "Add Participants"
- `showParticipantModal: boolean`

**Components**:
- `CompetitionCard` — name, status badge, match_type, participant count, actions
- `CompetitionForm` — name, description, match_type dropdown
- `ParticipantList` — add/remove aliases with validation
- `BracketPreview` — small SVG bracket (read-only, simplified)
- `MatchResultModal` — score entry per match

### Public: CompetitionDetail.tsx (/competitions/:id)

**Layout**:
- Full-width SVG bracket tree
- Rounds as columns (X axis)
- Matches as cards on Y axis
- Box-drawing connectors (│, ─, └, ┘)

**MatchCard**:
- Participant names + scores
- Winner highlighted
- Bye shown as dashed border box

### BracketView Component

```typescript
interface BracketViewProps {
  matches: Match[];
  rounds: number;
  onMatchClick?: (match: Match) => void; // admin only
}

// SVG Layout:
// - Column width: 200px
// - Match card: 180px × 60px
// - Vertical gap between matches: 20px
// - Round 1 matches start at Y = (containerHeight - matchHeight) / 2
// - Subsequent rounds: Y position = (prevMatch.y + prevMatch.height/2) aligned
```

## Permissions

| Permission | Admin | Staff | Description |
|------------|-------|-------|-------------|
| `competition.read` | ✓ | ✓ | View public bracket |
| `competition.create` | ✓ | ✓ | Create competition |
| `competition.update` | ✓ | ✓ | Edit competition, set match results |
| `competition.delete` | ✓ | ✗ | Delete competition |

## Component Inventory

| Component | Purpose | States |
|-----------|---------|--------|
| `CompetitionCard` | Admin list item | default, hover, loading |
| `CompetitionForm` | Create/edit form | clean, dirty, submitting, error |
| `ParticipantList` | Alias management | empty, populated, adding |
| `BracketView` | SVG bracket renderer | loading, empty, populated |
| `MatchCard` | Single match display | pending, completed, bye |
| `MatchResultModal` | Score entry | clean, submitting, error |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Bracket generation (2-16 participants, odd/even) | vitest with seeded DB |
| Unit | Aggregate calculation (HOME_AND_AWAY) | vitest |
| Unit | Bye propagation | vitest |
| Integration | createCompetition → addParticipants → generateBracket → setMatchResult | supertest |
| E2E | Admin creates competition, generates bracket, enters results | Playwright |

## Migration / Rollout

- **Migration v4**: Add competitions, participants, matches tables
- **Deploy order**: DB migration → restart backend → deploy frontend
- **Rollback**: Reverse migration drops tables (order: matches, participants, competitions)

## Open Questions

- [ ] Should competition `name` be unique, or can multiple "Copa 2026" exist?
- [ ] Is there a maximum participant limit enforced (e.g., max 16)?
- [ ] Should completed competitions be editable, or locked after `status=COMPLETED`?
