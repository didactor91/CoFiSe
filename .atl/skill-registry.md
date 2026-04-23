# Skill Registry — Seno-Com

## Project Standards

*None detected yet — this is a greenfield project*

## User Skills (Auto-resolved)

| Trigger Context | Skill | Source |
|-----------------|-------|--------|
| Go tests, Bubbletea TUI | go-testing | ~/.config/opencode/skills/ |
| Creating AI skills | skill-creator | ~/.config/opencode/skills/ |
| GitHub PR creation | branch-pr | ~/.config/opencode/skills/ |
| GitHub issue creation | issue-creation | ~/.config/opencode/skills/ |
| Dual adversarial review | judgment-day | ~/.config/opencode/skills/ |
| Library/SDK documentation | find-docs | ~/.config/opencode/skills/ |
| SDD phases | sdd-* (all) | ~/.config/opencode/skills/ |

## Project Conventions

*None yet — to be established during first change*

## Notes

- Strict TDD Mode: ✅ enabled (Vitest active on both client + server)
- Artifact Store: openspec + engram backup
- Language: Spanish (user writes in Spanish)

## Testing Capabilities

| Layer | Tool | Location |
|-------|------|----------|
| Unit | Vitest | cfs/client/src/__tests__/ (17 files) |
| Integration | Vitest + GraphQL | cfs/server/src/__tests__/ (11 files) |
| E2E | Playwright | cfs/e2e/ (login.spec.ts, fixtures/) |

Commands: `pnpm test` (unit), `pnpm test:e2e` (E2E), `vitest --coverage` (coverage)

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend | Vite + React | Per user requirement |
| API | GraphQL | Per user requirement |
| Backend | NodeJS | Per user requirement |
| Database | SQLite | Per user requirement |
| Reverse Proxy | Caddy | Per user requirement (not Nginx) |
| Auth | JWT with roles | admin/staff permissions |