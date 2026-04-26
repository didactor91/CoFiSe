# Proposal: Competition System

## Intent

Provide a tournament/competition management system for knockout brackets with configurable match types (single leg, home-and-away), automatic bracket generation with bye handling, and manual result entry with automatic winner advancement.

## Scope

### In Scope
- Competition CRUD in admin panel (create, list, edit, delete)
- Public competition page with bracket visualization
- Configurable match type: SINGLE (one match) or HOME_AWAY (two legs, aggregate score)
- Manual winner resolution when aggregate is tied
- Participant alias management with random draw (Fisher-Yates shuffle)
- Bye handling (odd participant counts advance one automatically)
- Result entry per match → automatic next-round population
- Bracket display horizontal rounds (football-style tree)

### Out of Scope
- League/round-robin formats (knockout only)
- Real-time updates (polling acceptable)
- Third-party integration or social sharing
- Multi-bracket tournaments (single bracket per competition)

## Capabilities

### New Capabilities
- `competition-management`: Full CRUD for competitions, participants, matches
- `competition-bracket`: Public bracket visualization with round-by-round progression
- `competition-scoring`: Result entry with single-leg and home-and-away modes, manual draw resolution

### Modified Capabilities
- `admin-pages`: Add Competitions page to admin navigation

## Approach

### Backend (GraphQL + SQLite)
- **Types**: `Competition`, `Participant`, `Match`, `Round`
- **Mutations**: `createCompetition`, `updateCompetition`, `deleteCompetition`, `addParticipants`, `generateBracket`, `setMatchResult`, `advanceWinner`
- **Queries**: `competitions`, `competition(id)`, `publicCompetitions`
- **Match states**: `PENDING`, `COMPLETED`
- **Match types**: `SINGLE_LEG`, `HOME_AWAY`

### Database Schema
```sql
competitions: id, name, description, match_type, status, created_at
participants: id, competition_id, alias, created_at
matches: id, competition_id, round, position, participant1_id, participant2_id,
         home_score1, home_score2, away_score1, away_score2, winner_id, status
```

### Bracket Algorithm
1. Fisher-Yates shuffle participants randomly
2. If odd count → last participant gets bye (advances without match)
3. Round 1: pair position `i` with position `(n-1-i)`
4. Subsequent rounds: winners fill positions following standard bracket tree structure
5. HOME_AWAY aggregate: `(home_score1 + away_score2)` vs `(home_score2 + away_score1)`
6. On tie → admin manually sets `winner_id`

### Frontend
- Admin: `CompetitionsPage.tsx` — CRUD table, participant management, bracket preview
- Public: `/competitions/:id` — SVG bracket tree, horizontal round layout, result entry modal
- Admin nav: add "Competiciones" link to `AdminLayout.tsx`

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `cfs/server/src/graphql/schema.ts` | Modified | Add Competition, Participant, Match types + operations |
| `cfs/server/src/modules/competitions/` | New | Resolver module |
| `cfs/database/migrations.ts` | Modified | Add competitions, participants, matches tables |
| `cfs/client/src/pages/admin/CompetitionsPage.tsx` | New | Admin CRUD page |
| `cfs/client/src/pages/CompetitionDetail.tsx` | New | Public bracket page |
| `cfs/client/src/pages/admin/AdminLayout.tsx` | Modified | Add Competitions nav link |
| `cfs/client/src/graphql/` | Modified | Generated types + new queries/mutations |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Bracket generation edge cases (3, 5, 7 participants) | Medium | Unit test with all odd/even counts 2–16 |
| Home-and-away score confusion (ida/vuelta labels) | Medium | Clear UI with Spanish labels "Ida" / "Vuelta" |
| Bye propagation not updating next round | Medium | Integration test covering bye → round 2 |

## Rollback Plan

1. Revert migration (DROP TABLE competitions, participants, matches)
2. Revert GraphQL schema changes
3. Delete `cfs/server/src/modules/competitions/`
4. Delete `CompetitionsPage.tsx`, `CompetitionDetail.tsx`
5. Revert `AdminLayout.tsx` nav link
6. Regenerate GraphQL types

## Dependencies

- GraphQL codegen (schema → types)
- No new external runtime dependencies

## Success Criteria

- [ ] Admin creates competition with 4–16 participants
- [ ] Bracket generates correctly for all odd/even participant counts
- [ ] Single leg: winner set directly from match result
- [ ] Home-and-away: aggregate calculated; admin manually overrides on tie
- [ ] Winner automatically populates next round match
- [ ] Public page shows full bracket with all results displayed
- [ ] Bye participants correctly identified and advanced to next round
