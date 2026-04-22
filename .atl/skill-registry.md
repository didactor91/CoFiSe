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

- Strict TDD Mode: disabled (no test runner)
- Artifact Store: hybrid (openspec files + engram backup)
- Language: Spanish (user writes in Spanish)

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend | Vite + React | Per user requirement |
| API | GraphQL | Per user requirement |
| Backend | NodeJS | Per user requirement |
| Database | SQLite | Per user requirement |
| Reverse Proxy | Caddy | Per user requirement (not Nginx) |
| Auth | JWT with roles | admin/staff permissions |