import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import mercurius from 'mercurius'
import { makeExecutableSchema } from '@graphql-tools/schema'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const TEST_DB_PATH = path.join(__dirname, 'test-queries.db')

describe('Public Query Tests', () => {
  let server: FastifyInstance
  let db: Database.Database

  beforeAll(async () => {
    // Create test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
    db = new Database(TEST_DB_PATH)
    db.pragma('journal_mode = WAL')

    // Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        stock INTEGER DEFAULT 0,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Seed news
    const now = new Date().toISOString()
    db.prepare(`INSERT INTO news (title, content, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`).run(
      'Test News 1', 'Content 1', 'http://example.com/img1.jpg', now, now
    )
    db.prepare(`INSERT INTO news (title, content, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`).run(
      'Test News 2', 'Content 2', 'http://example.com/img2.jpg', now, now
    )

    // Seed products
    db.prepare(`INSERT INTO products (name, description, price, stock, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      'Product 1', 'Description 1', 10.50, 5, 'http://example.com/prod1.jpg', now, now
    )
    db.prepare(`INSERT INTO products (name, description, price, stock, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      'Product 2', 'Description 2', 20.00, 10, 'http://example.com/prod2.jpg', now, now
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
      
      type Product {
        id: ID!
        name: String!
        description: String!
        price: Float!
        stock: Int!
        imageUrl: String
        createdAt: String!
        updatedAt: String!
      }
      
      type Query {
        news: [News!]!
        newsItem(id: ID!): News
        products: [Product!]!
        product(id: ID!): Product
      }
    `

    const resolvers = {
      Query: {
        news: () => {
          const news = db.prepare(`SELECT * FROM news ORDER BY created_at DESC`).all()
          return news.map((n: any) => ({
            id: n.id,
            title: n.title,
            content: n.content,
            imageUrl: n.image_url,
            createdAt: n.created_at,
            updatedAt: n.updated_at
          }))
        },
        newsItem: (_: any, args: { id: string }) => {
          const news = db.prepare(`SELECT * FROM news WHERE id = ?`).get(args.id) as any
          if (!news) return null
          return {
            id: news.id,
            title: news.title,
            content: news.content,
            imageUrl: news.image_url,
            createdAt: news.created_at,
            updatedAt: news.updated_at
          }
        },
        products: () => {
          const products = db.prepare(`SELECT * FROM products`).all()
          return products.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            stock: p.stock,
            imageUrl: p.image_url,
            createdAt: p.created_at,
            updatedAt: p.updated_at
          }))
        },
        product: (_: any, args: { id: string }) => {
          const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(args.id) as any
          if (!product) return null
          return {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            imageUrl: product.image_url,
            createdAt: product.created_at,
            updatedAt: product.updated_at
          }
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

  it('news returns array of News', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `{ news { id title content imageUrl createdAt updatedAt } }`
      })
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data.news).toHaveLength(2)
    expect(body.data.news[0]).toHaveProperty('id')
    expect(body.data.news[0]).toHaveProperty('title')
    expect(body.data.news[0]).toHaveProperty('content')
  })

  it('newsItem(id) returns single News', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `{ newsItem(id: "1") { id title content } }`
      })
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data.newsItem).toBeDefined()
    expect(body.data.newsItem.title).toBe('Test News 1')
  })

  it('newsItem(id) returns null for non-existent id', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `{ newsItem(id: "999") { id title } }`
      })
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data.newsItem).toBeNull()
  })

  it('products returns array of Product', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `{ products { id name description price stock } }`
      })
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data.products).toHaveLength(2)
    expect(body.data.products[0]).toHaveProperty('name')
    expect(body.data.products[0]).toHaveProperty('price')
    expect(body.data.products[0]).toHaveProperty('stock')
  })

  it('product(id) returns single Product', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `{ product(id: "1") { id name price stock } }`
      })
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data.product).toBeDefined()
    expect(body.data.product.name).toBe('Product 1')
    expect(body.data.product.price).toBe(10.50)
  })

  it('product(id) returns null for non-existent id', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `{ product(id: "999") { id name } }`
      })
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data.product).toBeNull()
  })
})