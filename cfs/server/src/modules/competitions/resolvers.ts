import { db } from '../../db/index.js'
import { requirePermission, type Context } from '../shared/guards.js'
import { competitionFromRow, participantFromRow, matchFromRow } from '../shared/mappers.js'

export const competitionsResolvers = {
    Query: {
        // Staff/Admin only query (includes DRAFT status) — use publicCompetition for public
        competitions: (_: any, __: any, ctx: Context) => {
            requirePermission(ctx, 'competition.read')
            const rows = db.prepare(`SELECT * FROM competitions ORDER BY created_at DESC`).all()
            return rows.map(competitionFromRow)
        },

        // Public query — no auth required (only returns non-DRAFT)
        competition: (_: any, args: { id: string }, ctx: Context) => {
            // Note: uses competition.read permission but allows staff/admin to see DRAFT too
            // For public-facing single competition lookup, use publicCompetition instead
            requirePermission(ctx, 'competition.read')
            const row = db.prepare(`SELECT * FROM competitions WHERE id = ?`).get(args.id)
            return row ? competitionFromRow(row) : null
        },

        // Public query — no auth required
        publicCompetitions: () => {
            const rows = db.prepare(`SELECT * FROM competitions WHERE status != 'DRAFT' ORDER BY created_at DESC`).all()
            return rows.map(competitionFromRow)
        },

        // Public single competition lookup — no auth required
        publicCompetition: (_: any, args: { id: string }) => {
            const row = db.prepare(`SELECT * FROM competitions WHERE id = ? AND status != 'DRAFT'`).get(args.id)
            return row ? competitionFromRow(row) : null
        },
    },

    Mutation: {
        createCompetition: (_: any, args: { input: any }, ctx: Context) => {
            requirePermission(ctx, 'competition.create')
            const { name, description, matchType, participantCount } = args.input

            if (!name || name.trim() === '') throw new Error('Name is required')
            if (name.length > 200) throw new Error('Name must be 200 characters or less')
            if (!matchType) throw new Error('Match type is required')
            if (!['SINGLE_LEG', 'HOME_AND_AWAY'].includes(matchType)) throw new Error('Invalid match type')
            if (!participantCount) throw new Error('Participant count is required')
            if (participantCount < 2 || participantCount > 16) throw new Error('Participant count must be between 2 and 16')

            const now = new Date().toISOString()
            const result = db.prepare(`
                INSERT INTO competitions (name, description, match_type, status, participant_count, created_at, updated_at)
                VALUES (?, ?, ?, 'DRAFT', ?, ?, ?)
            `).run(name, description || null, matchType, participantCount, now, now)

            return {
                id: result.lastInsertRowid.toString(),
                name,
                description: description || null,
                matchType,
                status: 'DRAFT',
                participantCount,
                createdAt: now,
                updatedAt: now,
            }
        },

        updateCompetition: (_: any, args: { id: string; input: any }, ctx: Context) => {
            requirePermission(ctx, 'competition.update')
            const existing = db.prepare(`SELECT * FROM competitions WHERE id = ?`).get(args.id) as any
            if (!existing) throw new Error('Competition not found')

            const { name, description, matchType, status } = args.input

            if (name !== undefined) {
                if (name.trim() === '') throw new Error('Name is required')
                if (name.length > 200) throw new Error('Name must be 200 characters or less')
            }
            if (matchType !== undefined && !['SINGLE_LEG', 'HOME_AND_AWAY'].includes(matchType)) {
                throw new Error('Invalid match type')
            }
            if (status !== undefined && !['DRAFT', 'ACTIVE', 'COMPLETED'].includes(status)) {
                throw new Error('Invalid status')
            }

            const now = new Date().toISOString()
            const updateName = name ?? existing.name
            const updateDescription = description ?? existing.description
            const updateMatchType = matchType ?? existing.match_type
            const updateStatus = status ?? existing.status

            db.prepare(`
                UPDATE competitions SET name = ?, description = ?, match_type = ?, status = ?, updated_at = ?
                WHERE id = ?
            `).run(updateName, updateDescription, updateMatchType, updateStatus, now, args.id)

            return {
                id: args.id,
                name: updateName,
                description: updateDescription,
                matchType: updateMatchType,
                status: updateStatus,
                participantCount: existing.participant_count,
                createdAt: existing.created_at,
                updatedAt: now,
            }
        },

        deleteCompetition: (_: any, args: { id: string }, ctx: Context) => {
            requirePermission(ctx, 'competition.delete')
            const existing = db.prepare(`SELECT * FROM competitions WHERE id = ?`).get(args.id)
            if (!existing) throw new Error('Competition not found')

            // Cascade delete matches, participants, then competition
            db.prepare(`DELETE FROM matches WHERE competition_id = ?`).run(args.id)
            db.prepare(`DELETE FROM participants WHERE competition_id = ?`).run(args.id)
            db.prepare(`DELETE FROM competitions WHERE id = ?`).run(args.id)
            return true
        },

        addParticipants: (_: any, args: { input: any }, ctx: Context) => {
            requirePermission(ctx, 'competition.update')
            const { competitionId, aliases } = args.input

            const competition = db.prepare(`SELECT * FROM competitions WHERE id = ?`).get(competitionId) as any
            if (!competition) throw new Error('Competition not found')
            if (competition.status !== 'DRAFT') throw new Error('Participants locked after bracket generation')

            const existingCount = db.prepare(`SELECT COUNT(*) as count FROM participants WHERE competition_id = ?`).get(competitionId) as any
            if (existingCount.count + aliases.length > competition.participant_count) {
                throw new Error(`Maximum participants (${competition.participant_count}) reached`)
            }

            const now = new Date().toISOString()
            const insertStmt = db.prepare(`INSERT INTO participants (competition_id, alias, created_at) VALUES (?, ?, ?)`)

            for (const alias of aliases) {
                if (!alias || alias.trim() === '') throw new Error('Alias cannot be empty')
                insertStmt.run(competitionId, alias.trim(), now)
            }

            return competitionFromRow(competition)
        },

        generateBracket: (_: any, args: { competitionId: string }, ctx: Context) => {
            requirePermission(ctx, 'competition.update')
            const competitionId = parseInt(args.competitionId)

            const competition = db.prepare(`SELECT * FROM competitions WHERE id = ?`).get(competitionId) as any
            if (!competition) throw new Error('Competition not found')
            if (competition.status !== 'DRAFT') throw new Error('Bracket already generated')

            const participants = db.prepare(`SELECT * FROM participants WHERE competition_id = ? ORDER BY id`).all(competitionId) as any[]
            if (participants.length < 2) throw new Error('Minimum 2 participants required')
            if (participants.length < competition.participant_count) {
                throw new Error(`Not all participants added. Need ${competition.participant_count}, have ${participants.length}`)
            }

            // Fisher-Yates shuffle
            for (let i = participants.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [participants[i], participants[j]] = [participants[j], participants[i]]
            }

            const n = participants.length
            let byeParticipant = null

            // Handle odd count - last participant gets bye
            if (n % 2 === 1) {
                byeParticipant = participants.pop()
            }

            const rounds = Math.ceil(Math.log2(n))
            const matchesInRound1 = Math.pow(2, rounds - 1)

            // Create matches for round 1
            for (let pos = 0; pos < matchesInRound1; pos++) {
                const p1Index = pos
                const p2Index = matchesInRound1 * 2 - 1 - pos

                const participant1Id = participants[p1Index]?.id
                const participant2Id = participants[p2Index]?.id

                if (participant1Id && participant2Id) {
                    db.prepare(`
                        INSERT INTO matches (competition_id, round, position, participant1_id, participant2_id, status)
                        VALUES (?, 1, ?, ?, ?, 'PENDING')
                    `).run(competitionId, pos, participant1Id, participant2Id)
                } else if (participant1Id && byeParticipant) {
                    // Bye - advance participant directly to round 2
                    db.prepare(`
                        INSERT INTO matches (competition_id, round, position, participant1_id, participant2_id, status, is_bye)
                        VALUES (?, 2, ?, ?, NULL, 'PENDING', 1)
                    `).run(competitionId, Math.floor(pos / 2), participant1Id)
                }
            }

            // Create empty matches for subsequent rounds
            for (let round = 2; round <= rounds; round++) {
                const matchesInRound = Math.pow(2, rounds - round)
                for (let pos = 0; pos < matchesInRound; pos++) {
                    db.prepare(`
                        INSERT INTO matches (competition_id, round, position, participant1_id, participant2_id, status)
                        VALUES (?, ?, ?, NULL, NULL, 'PENDING')
                    `).run(competitionId, round, pos)
                }
            }

            // Update competition status to ACTIVE
            const now = new Date().toISOString()
            db.prepare(`UPDATE competitions SET status = 'ACTIVE', updated_at = ? WHERE id = ?`).run(now, competitionId)

            return competitionFromRow({ ...competition, status: 'ACTIVE', updated_at: now })
        },

        setMatchResult: (_: any, args: { input: any }, ctx: Context) => {
            requirePermission(ctx, 'competition.update')
            const { matchId, homeScore1, homeScore2, awayScore1, awayScore2, manualWinnerId } = args.input

            const match = db.prepare(`SELECT * FROM matches WHERE id = ?`).get(matchId) as any
            if (!match) throw new Error('Match not found')
            if (match.status === 'COMPLETED') throw new Error('Match already completed')
            if (match.is_bye) throw new Error('Bye matches cannot have results')

            const competition = db.prepare(`SELECT * FROM competitions WHERE id = ?`).get(match.competition_id) as any
            if (!competition) throw new Error('Competition not found')

            let winnerId = null
            const p1Total = (homeScore1 ?? 0) + (awayScore2 ?? 0)
            const p2Total = (homeScore2 ?? 0) + (awayScore1 ?? 0)

            if (competition.match_type === 'SINGLE_LEG') {
                // Single leg: winner is higher score, tie requires manual winner
                const score = homeScore1 ?? 0
                const score2 = homeScore2 ?? 0
                if (score > score2) {
                    winnerId = match.participant1_id
                } else if (score2 > score) {
                    winnerId = match.participant2_id
                } else if (manualWinnerId) {
                    winnerId = parseInt(manualWinnerId)
                } else {
                    throw new Error('Tie requires manual winner selection')
                }
            } else {
                // HOME_AND_AWAY: aggregate scores
                if (p1Total > p2Total) {
                    winnerId = match.participant1_id
                } else if (p2Total > p1Total) {
                    winnerId = match.participant2_id
                } else if (manualWinnerId) {
                    winnerId = parseInt(manualWinnerId)
                } else {
                    throw new Error('Tie requires manual winner selection')
                }
            }

            // Update match with scores and winner
            const now = new Date().toISOString()
            db.prepare(`
                UPDATE matches SET home_score1 = ?, home_score2 = ?, away_score1 = ?, away_score2 = ?, winner_id = ?, status = 'COMPLETED'
                WHERE id = ?
            `).run(homeScore1 ?? null, homeScore2 ?? null, awayScore1 ?? null, awayScore2 ?? null, winnerId, matchId)

            // Advance winner to next round
            const nextRound = match.round + 1
            const nextPosition = Math.floor(match.position / 2)
            const nextMatch = db.prepare(`
                SELECT * FROM matches WHERE competition_id = ? AND round = ? AND position = ?
            `).get(match.competition_id, nextRound, nextPosition) as any

            if (nextMatch) {
                const isEvenPosition = match.position % 2 === 0
                if (isEvenPosition) {
                    db.prepare(`UPDATE matches SET participant1_id = ? WHERE id = ?`).run(winnerId, nextMatch.id)
                } else {
                    db.prepare(`UPDATE matches SET participant2_id = ? WHERE id = ?`).run(winnerId, nextMatch.id)
                }
            }

            // Check if competition is complete (final match has winner)
            const finalMatches = db.prepare(`
                SELECT * FROM matches WHERE competition_id = ? AND round = (SELECT MAX(round) FROM matches WHERE competition_id = ?)
            `).all(match.competition_id, match.competition_id) as any[]

            const allFinalMatchesComplete = finalMatches.every(m => m.status === 'COMPLETED')
            if (allFinalMatchesComplete && finalMatches.length === 1) {
                db.prepare(`UPDATE competitions SET status = 'COMPLETED', updated_at = ? WHERE id = ?`).run(now, match.competition_id)
            }

            return matchFromRow({ ...match, home_score1: homeScore1, home_score2: homeScore2, away_score1: awayScore1, away_score2: awayScore2, winner_id: winnerId, status: 'COMPLETED' })
        },
    },

    Competition: {
        participants: (parent: any) => {
            const rows = db.prepare(`SELECT * FROM participants WHERE competition_id = ?`).all(parent.id)
            return rows.map(participantFromRow)
        },
        matches: (parent: any) => {
            const rows = db.prepare(`SELECT * FROM matches WHERE competition_id = ? ORDER BY round, position`).all(parent.id)
            return rows.map(matchFromRow)
        },
    },

    Match: {
        participant1: (parent: any) => {
            if (!parent.participant1_id) return null
            const row = db.prepare(`SELECT * FROM participants WHERE id = ?`).get(parent.participant1_id)
            return row ? participantFromRow(row) : null
        },
        participant2: (parent: any) => {
            if (!parent.participant2_id) return null
            const row = db.prepare(`SELECT * FROM participants WHERE id = ?`).get(parent.participant2_id)
            return row ? participantFromRow(row) : null
        },
        winner: (parent: any) => {
            if (!parent.winner_id) return null
            const row = db.prepare(`SELECT * FROM participants WHERE id = ?`).get(parent.winner_id)
            return row ? participantFromRow(row) : null
        },
    },
}
