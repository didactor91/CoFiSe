import { db } from '../../db/index.js'
import {
  buildBracketNodes,
  buildDoubleElimNodes,
  buildRoundRobinNodes,
  generateSingleElimMatches,
  generateDoubleElimMatches,
  generateRoundRobinMatches,
  hasClearWinner,
  resolveWinnerName,
  type BracketNodeSpec,
  type MatchSpec,
} from '../shared/brackets.js'
import { requirePermission, type Context } from '../shared/guards.js'
import {
  competitionFromRow,
  participantFromRow,
  matchFromRow,
  bracketNodeFromRow,
} from '../shared/mappers.js'

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
      const rows = db
        .prepare(`SELECT * FROM competitions WHERE status != 'DRAFT' ORDER BY created_at DESC`)
        .all()
      return rows.map(competitionFromRow)
    },

    // Public single competition lookup — no auth required
    publicCompetition: (_: any, args: { id: string }) => {
      const row = db
        .prepare(`SELECT * FROM competitions WHERE id = ? AND status != 'DRAFT'`)
        .get(args.id)
      return row ? competitionFromRow(row) : null
    },

    // Bracket nodes for a competition
    bracketNodes: (_: any, args: { competitionId: string }, ctx: Context) => {
      requirePermission(ctx, 'competition.read')
      const compId = parseInt(args.competitionId)
      const rows = db
        .prepare(`SELECT * FROM bracket_nodes WHERE competition_id = ? ORDER BY round, position`)
        .all(compId)
      return rows.map(bracketNodeFromRow)
    },
  },

  Mutation: {
    createCompetition: (_: any, args: { input: any }, ctx: Context) => {
      requirePermission(ctx, 'competition.create')
      const { name, description, matchType, participantCount, format } = args.input

      if (!name || name.trim() === '') throw new Error('Name is required')
      if (name.length > 200) throw new Error('Name must be 200 characters or less')
      if (!matchType) throw new Error('Match type is required')
      if (!['SINGLE_LEG', 'HOME_AND_AWAY'].includes(matchType))
        throw new Error('Invalid match type')
      if (!participantCount) throw new Error('Participant count is required')
      if (participantCount < 2 || participantCount > 32)
        throw new Error('Participant count must be between 2 and 32')

      // format is optional and stored for reference, defaults to match type derived format
      const tournamentFormat =
        format || (matchType === 'HOME_AND_AWAY' ? 'HOME_AWAY' : 'SINGLE_ELIMINATION')

      const now = new Date().toISOString()
      const result = db
        .prepare(
          `
                INSERT INTO competitions (name, description, match_type, status, participant_count, created_at, updated_at)
                VALUES (?, ?, ?, 'DRAFT', ?, ?, ?)
            `,
        )
        .run(name, description || null, matchType, participantCount, now, now)

      return {
        id: result.lastInsertRowid.toString(),
        name,
        description: description || null,
        matchType,
        status: 'DRAFT',
        participantCount,
        format: tournamentFormat,
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

      db.prepare(
        `
                UPDATE competitions SET name = ?, description = ?, match_type = ?, status = ?, updated_at = ?
                WHERE id = ?
            `,
      ).run(updateName, updateDescription, updateMatchType, updateStatus, now, args.id)

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

      // Cascade delete bracket_nodes, matches, participants, then competition
      db.prepare(`DELETE FROM bracket_nodes WHERE competition_id = ?`).run(args.id)
      db.prepare(`DELETE FROM matches WHERE competition_id = ?`).run(args.id)
      db.prepare(`DELETE FROM participants WHERE competition_id = ?`).run(args.id)
      db.prepare(`DELETE FROM competitions WHERE id = ?`).run(args.id)
      return true
    },

    addParticipants: (_: any, args: { input: any }, ctx: Context) => {
      requirePermission(ctx, 'competition.update')
      const { competitionId, aliases } = args.input

      const competition = db
        .prepare(`SELECT * FROM competitions WHERE id = ?`)
        .get(competitionId) as any
      if (!competition) throw new Error('Competition not found')
      if (competition.status !== 'DRAFT')
        throw new Error('Participants locked after bracket generation')

      const existingCount = db
        .prepare(`SELECT COUNT(*) as count FROM participants WHERE competition_id = ?`)
        .get(competitionId) as any
      if (existingCount.count + aliases.length > competition.participant_count) {
        throw new Error(`Maximum participants (${competition.participant_count}) reached`)
      }

      const now = new Date().toISOString()
      const insertStmt = db.prepare(
        `INSERT INTO participants (competition_id, alias, created_at) VALUES (?, ?, ?)`,
      )

      for (const alias of aliases) {
        if (!alias || alias.trim() === '') throw new Error('Alias cannot be empty')
        insertStmt.run(competitionId, alias.trim(), now)
      }

      return competitionFromRow(competition)
    },

    generateBracket: (
      _: any,
      args: { input: { competitionId: string; format?: string } },
      ctx: Context,
    ) => {
      requirePermission(ctx, 'competition.update')
      const { competitionId, format = 'SINGLE_ELIMINATION' } = args.input
      const compId = parseInt(competitionId)

      const competition = db.prepare(`SELECT * FROM competitions WHERE id = ?`).get(compId) as any
      if (!competition) throw new Error('Competition not found')
      if (competition.status !== 'DRAFT') throw new Error('Bracket already generated')

      const participants = db
        .prepare(`SELECT * FROM participants WHERE competition_id = ? ORDER BY id`)
        .all(compId) as any[]
      if (participants.length < 2) throw new Error('Minimum 2 participants required')
      if (participants.length < competition.participant_count) {
        throw new Error(
          `Not all participants added. Need ${competition.participant_count}, have ${participants.length}`,
        )
      }

      const teamNames = participants.map((p: any) => p.alias)

      let nodes: BracketNodeSpec[]
      let matches: MatchSpec[]

      switch (format) {
        case 'SINGLE_ELIMINATION':
        case 'HOME_AWAY':
          nodes = buildBracketNodes(teamNames, true)
          matches = generateSingleElimMatches(nodes)
          break
        case 'DOUBLE_ELIMINATION':
          nodes = buildDoubleElimNodes(teamNames, true)
          matches = generateDoubleElimMatches(nodes)
          break
        case 'ROUND_ROBIN':
          nodes = buildRoundRobinNodes(teamNames, true)
          matches = generateRoundRobinMatches(teamNames, true)
          break
        default:
          throw new Error(`Unsupported bracket format: ${format}`)
      }

      const now = new Date().toISOString()

      // Clear existing bracket state for this competition
      db.prepare(`DELETE FROM matches WHERE competition_id = ?`).run(compId)
      db.prepare(`DELETE FROM bracket_nodes WHERE competition_id = ?`).run(compId)

      // Create a map to track flat index → real ID for wiring
      const nodeIdByIndex: Map<number, number> = new Map()

      // Persist bracket nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        const result = db
          .prepare(
            `
                    INSERT INTO bracket_nodes (competition_id, round, position, team_a_name, team_b_name, next_node_id, next_slot, bracket_label, is_bye, created_at)
                    VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)
                `,
          )
          .run(
            compId,
            n.round,
            n.position,
            n.teamAName,
            n.teamBName,
            n.nextSlot,
            n.bracketLabel || null,
            n.isBye ? 1 : 0,
            now,
          )

        // Map flat index to real node ID
        const flatIndex = i
        nodeIdByIndex.set(flatIndex, result.lastInsertRowid as number)
      }

      // Wire next_node_id for nodes that have a next destination
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        if (n.nextNodeIndex !== null) {
          const targetNodeId = nodeIdByIndex.get(n.nextNodeIndex)
          const sourceNodeId = nodeIdByIndex.get(i)
          if (targetNodeId && sourceNodeId) {
            db.prepare(`UPDATE bracket_nodes SET next_node_id = ? WHERE id = ?`).run(
              targetNodeId,
              sourceNodeId,
            )
          }
        }
      }

      // Persist matches with node linkage
      for (const m of matches) {
        // Find the bracket node that corresponds to this match
        const nodeIndex = nodes.findIndex(
          (n) => n.teamAName === m.participantA && n.teamBName === m.participantB,
        )
        const bracketNodeId = nodeIndex >= 0 ? nodeIdByIndex.get(nodeIndex) : null

        db.prepare(
          `
                    INSERT INTO matches (competition_id, round, position, participant1_id, participant2_id, status, is_bye, node_id, created_at)
                    VALUES (?, 1, ?, ?, ?, 'PENDING', ?, ?, ?)
                `,
        ).run(
          compId,
          m.order - 1, // position based on order
          participants.find((p: any) => p.alias === m.participantA)?.id || null,
          participants.find((p: any) => p.alias === m.participantB)?.id || null,
          m.isBye ? 1 : 0,
          bracketNodeId,
          now,
        )
      }

      // Update competition status to ACTIVE
      db.prepare(`UPDATE competitions SET status = 'ACTIVE', updated_at = ? WHERE id = ?`).run(
        now,
        compId,
      )

      const updatedComp = db.prepare(`SELECT * FROM competitions WHERE id = ?`).get(compId) as any
      return competitionFromRow(updatedComp)
    },

    setMatchResult: (_: any, args: { input: any }, ctx: Context) => {
      requirePermission(ctx, 'competition.update')
      const { matchId, homeScore1, homeScore2, awayScore1, awayScore2, manualWinnerId } = args.input

      const match = db.prepare(`SELECT * FROM matches WHERE id = ?`).get(matchId) as any
      if (!match) throw new Error('Match not found')
      if (match.status === 'COMPLETED') throw new Error('Match already completed')
      if (match.is_bye) throw new Error('Bye matches cannot have results')

      const competition = db
        .prepare(`SELECT * FROM competitions WHERE id = ?`)
        .get(match.competition_id) as any
      if (!competition) throw new Error('Competition not found')

      // Use pure algorithm to determine winner
      const scoreA = homeScore1 ?? 0
      const scoreB = homeScore2 ?? 0
      let winnerId: number | null = null

      if (competition.match_type === 'HOME_AND_AWAY') {
        // HOME_AND_AWAY: aggregate scores from both legs
        // p1Total = homeScore1 + awayScore2
        // p2Total = homeScore2 + awayScore1
        const p1Total = (homeScore1 ?? 0) + (awayScore2 ?? 0)
        const p2Total = (homeScore2 ?? 0) + (awayScore1 ?? 0)

        if (p1Total > p2Total) {
          winnerId = match.participant1_id
        } else if (p2Total > p1Total) {
          winnerId = match.participant2_id
        } else if (manualWinnerId) {
          winnerId = parseInt(manualWinnerId)
        } else {
          throw new Error('Tie requires manual winner selection')
        }
      } else {
        // SINGLE_LEG: simple winner based on single score
        if (hasClearWinner(scoreA, scoreB)) {
          winnerId =
            resolveWinnerName(
              match.participant1_id ? `Participant ${match.participant1_id}` : null,
              match.participant2_id ? `Participant ${match.participant2_id}` : null,
              scoreA,
              scoreB,
              null,
            ) === `Participant ${match.participant1_id}`
              ? match.participant1_id
              : match.participant2_id
        } else if (manualWinnerId) {
          winnerId = parseInt(manualWinnerId)
        } else {
          throw new Error('Tie requires manual winner selection')
        }
      }

      const now = new Date().toISOString()

      // Update match with scores and winner
      db.prepare(
        `
                UPDATE matches SET home_score1 = ?, home_score2 = ?, away_score1 = ?, away_score2 = ?, winner_id = ?, status = 'COMPLETED'
                WHERE id = ?
            `,
      ).run(
        homeScore1 ?? null,
        homeScore2 ?? null,
        awayScore1 ?? null,
        awayScore2 ?? null,
        winnerId,
        matchId,
      )

      // Auto-advancement: if winnerId is set and this match has a bracket node, advance winner to next node
      if (winnerId && match.node_id) {
        const currentNode = db
          .prepare(`SELECT * FROM bracket_nodes WHERE id = ?`)
          .get(match.node_id) as any

        if (currentNode && currentNode.next_node_id && currentNode.next_slot) {
          // Determine winner name to advance
          const winnerName =
            winnerId === match.participant1_id ? currentNode.team_a_name : currentNode.team_b_name

          // Update the next node's appropriate slot with the winner name
          db.prepare(
            `
                        UPDATE bracket_nodes SET ${currentNode.next_slot === 'A' ? 'team_a_name' : 'team_b_name'} = ?
                        WHERE id = ?
                    `,
          ).run(winnerName, currentNode.next_node_id)
        }
      }

      // Advance winner to next round in matches table
      const nextRound = match.round + 1
      const nextPosition = Math.floor(match.position / 2)
      const nextMatch = db
        .prepare(
          `
                SELECT * FROM matches WHERE competition_id = ? AND round = ? AND position = ?
            `,
        )
        .get(match.competition_id, nextRound, nextPosition) as any

      if (nextMatch) {
        const isEvenPosition = match.position % 2 === 0
        if (isEvenPosition) {
          db.prepare(`UPDATE matches SET participant1_id = ? WHERE id = ?`).run(
            winnerId,
            nextMatch.id,
          )
        } else {
          db.prepare(`UPDATE matches SET participant2_id = ? WHERE id = ?`).run(
            winnerId,
            nextMatch.id,
          )
        }
      }

      // Check if competition is complete (final match has winner)
      const finalMatches = db
        .prepare(
          `
                SELECT * FROM matches WHERE competition_id = ? AND round = (SELECT MAX(round) FROM matches WHERE competition_id = ?)
            `,
        )
        .all(match.competition_id, match.competition_id) as any[]

      const allFinalMatchesComplete = finalMatches.every((m) => m.status === 'COMPLETED')
      if (allFinalMatchesComplete && finalMatches.length === 1) {
        db.prepare(`UPDATE competitions SET status = 'COMPLETED', updated_at = ? WHERE id = ?`).run(
          now,
          match.competition_id,
        )
      }

      return matchFromRow({
        ...match,
        home_score1: homeScore1,
        home_score2: homeScore2,
        away_score1: awayScore1,
        away_score2: awayScore2,
        winner_id: winnerId,
        status: 'COMPLETED',
      })
    },
  },

  Competition: {
    participants: (parent: any) => {
      const rows = db.prepare(`SELECT * FROM participants WHERE competition_id = ?`).all(parent.id)
      return rows.map(participantFromRow)
    },
    matches: (parent: any) => {
      const rows = db
        .prepare(`SELECT * FROM matches WHERE competition_id = ? ORDER BY round, position`)
        .all(parent.id)
      return rows.map(matchFromRow)
    },
    bracketNodes: (parent: any) => {
      const rows = db
        .prepare(`SELECT * FROM bracket_nodes WHERE competition_id = ? ORDER BY round, position`)
        .all(parent.id)
      return rows.map(bracketNodeFromRow)
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
