import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import mercurius from 'mercurius'
import { makeExecutableSchema } from '@graphql-tools/schema'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const TEST_DB_PATH = path.join(__dirname, 'test-news.db')

describe('News CRUD Mutations', () => {
  let server: FastifyInstance
  let db: Database.Database

  beforeAll(async () => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
    db = new Database(TEST_DB_PATH)
    db.pragma('journal_mode = WAL')

    db.exec(`
      CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)

    const now = new Date().toISOString()
    db.prepare(`INSERT INTO news (title, content, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`).run(
      'Existing News', 'Existing content', null, now, now
    )

    const typeDefs = `
      type News {
        id: ID!
        title: String!
        content: String!
        imageUrl: String
        createdAt: String!
        updatedAt: String!
      }
      
      type Query {
        news: [News!]!
        newsItem(id: ID!): News
      }
      
      type Mutation {
        createNews(input: CreateNewsInput!): News!
        updateNews(id: ID!, input: UpdateNewsInput!): News!
        deleteNews(id: ID!): Boolean!
      }
      
      input CreateNewsInput {
        title: String!
        content: String!
        imageUrl: String
      }
      
      input UpdateNewsInput {
        title: String
        content: String
        imageUrl: String
      }
    `

    const resolvers = {
      Query: {
        news: () => {
          const news = db.prepare(`SELECT * FROM news ORDER BY created_at DESC`).all()
          return news.map((n: any) => ({
            id: n.id, title: n.title, content: n.content,
            imageUrl: n.image_url, createdAt: n.created_at, updatedAt: n.updated_at
          }))
        },
        newsItem: (_: any, args: { id: string }) => {
          const news = db.prepare(`SELECT * FROM news WHERE id = ?`).get(args.id) as any
          if (!news) return null
          return {
            id: news.id, title: news.title, content: news.content,
            imageUrl: news.image_url, createdAt: news.created_at, updatedAt: news.updated_at
          }
        }
      },
      Mutation: {
        createNews: (_: any, args: { input: any }) => {
          const now = new Date().toISOString()
          const result = db.prepare(`
            INSERT INTO news (title, content, image_url, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
          `).run(args.input.title, args.input.content, args.input.imageUrl || null, now, now)
          
          return {
            id: result.lastInsertRowid.toString(),
            title: args.input.title,
            content: args.input.content,
            imageUrl: args.input.imageUrl || null,
            createdAt: now,
            updatedAt: now
          }
        },
        updateNews: (_: any, args: { id: string; input: any }) => {
          const existing = db.prepare(`SELECT * FROM news WHERE id = ?`).get(args.id) as any
          if (!existing) {
            throw new Error('News not found')
          }
          const now = new Date().toISOString()
          const title = args.input.title ?? existing.title
          const content = args.input.content ?? existing.content
          const imageUrl = args.input.imageUrl ?? existing.image_url
          
          db.prepare(`UPDATE news SET title = ?, content = ?, image_url = ?, updated_at = ? WHERE id = ?`)
            .run(title, content, imageUrl, now, args.id)
          
          return {
            id: args.id,
            title,
            content,
            imageUrl,
            createdAt: existing.created_at,
            updatedAt: now
          }
        },
        deleteNews: (_: any, args: { id: string }) => {
          const existing = db.prepare(`SELECT * FROM news WHERE id = ?`).get(args.id)
          if (!existing) {
            throw new Error('News not found')
          }
          db.prepare(`DELETE FROM news WHERE id = ?`).run(args.id)
          return true
        }
      }
    }

    const testSchema = makeExecutableSchema({ typeDefs, resolvers })

    server = Fastify({ logger: false })
    await server.register(mercurius, { schema: testSchema, resolvers })
    await server.ready()
  })

  afterAll(async () => {
    await server.close()
    db.close()
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
  })

  it('createNews creates news item', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `mutation { createNews(input: { title: "New Title", content: "New Content", imageUrl: "http://example.com/img.jpg" }) { id title content imageUrl createdAt updatedAt } }`
      })
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data.createNews).toBeDefined()
    expect(body.data.createNews.title).toBe('New Title')
    expect(body.data.createNews.content).toBe('New Content')
    expect(body.data.createNews.imageUrl).toBe('http://example.com/img.jpg')
    expect(body.data.createNews.id).toBeDefined()
  })

  it('updateNews updates existing news', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `mutation { updateNews(id: "1", input: { title: "Updated Title" }) { id title content createdAt updatedAt } }`
      })
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data.updateNews).toBeDefined()
    expect(body.data.updateNews.title).toBe('Updated Title')
    expect(body.data.updateNews.content).toBe('Existing content')
  })

  it('updateNews with non-existent id returns error', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `mutation { updateNews(id: "999", input: { title: "Should Fail" }) { id title } }`
      })
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data).toBeNull()
    expect(body.errors).toBeDefined()
    expect(body.errors[0].message).toBe('News not found')
  })

  it('deleteNews removes news', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `mutation { deleteNews(id: "1") }`
      })
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data.deleteNews).toBe(true)

    // Verify it's deleted
    const checkResponse = await server.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `{ newsItem(id: "1") { id title } }`
      })
    })

    const checkBody = JSON.parse(checkResponse.body)
    expect(checkBody.data.newsItem).toBeNull()
  })

  it('deleteNews with non-existent id returns error', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `mutation { deleteNews(id: "999") }`
      })
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data).toBeNull()
    expect(body.errors).toBeDefined()
    expect(body.errors[0].message).toBe('News not found')
  })
})