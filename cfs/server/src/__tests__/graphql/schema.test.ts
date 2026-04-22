import { describe, it, expect } from 'vitest'
import { buildSchema } from 'graphql'

describe('GraphQL Schema', () => {
  const typeDefs = `
    scalar DateTime

    type News {
      id: ID!
      title: String!
      content: String!
      imageUrl: String
      createdAt: DateTime!
      updatedAt: DateTime!
    }

    type Product {
      id: ID!
      name: String!
      description: String!
      price: Float!
      stock: Int!
      imageUrl: String
      createdAt: DateTime!
      updatedAt: DateTime!
    }

    type Reservation {
      id: ID!
      product: Product!
      productId: ID!
      quantity: Int!
      name: String!
      email: String!
      phone: String!
      notes: String
      status: ReservationStatus!
      createdAt: DateTime!
      updatedAt: DateTime!
    }

    enum ReservationStatus {
      PENDING
      CONFIRMED
      CANCELLED
      COMPLETED
    }

    type User {
      id: ID!
      email: String!
      role: UserRole!
      createdAt: DateTime!
    }

    enum UserRole {
      ADMIN
      STAFF
    }

    type AuthPayload {
      token: String!
      user: User!
    }

    type Query {
      news: [News!]!
      newsItem(id: ID!): News
      products: [Product!]!
      product(id: ID!): Product
      me: User
      allNews: [News!]!
      reservations(status: ReservationStatus): [Reservation!]!
      reservation(id: ID!): Reservation
      users: [User!]!
    }

    type Mutation {
      createReservation(input: CreateReservationInput!): Reservation!
      login(email: String!, password: String!): AuthPayload!
      createNews(input: CreateNewsInput!): News!
      updateNews(id: ID!, input: UpdateNewsInput!): News!
      deleteNews(id: ID!): Boolean!
      updateReservationStatus(id: ID!, status: ReservationStatus!): Reservation!
      createUser(input: CreateUserInput!): User!
      deleteUser(id: ID!): Boolean!
    }

    input CreateReservationInput {
      productId: ID!
      quantity: Int!
      name: String!
      email: String!
      phone: String!
      notes: String
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

    input CreateUserInput {
      email: String!
      password: String!
      role: UserRole!
    }
  `

  it('schema has all required types defined', () => {
    const schema = buildSchema(typeDefs)
    
    const queryType = schema.getQueryType()
    const mutationType = schema.getMutationType()
    
    expect(queryType).toBeDefined()
    expect(mutationType).toBeDefined()
  })

  it('schema has all public queries defined', () => {
    const schema = buildSchema(typeDefs)
    const queryType = schema.getQueryType()!
    const fields = queryType.getFields()
    
    expect(fields.news).toBeDefined()
    expect(fields.newsItem).toBeDefined()
    expect(fields.products).toBeDefined()
    expect(fields.product).toBeDefined()
    expect(fields.me).toBeDefined()
  })

  it('schema has all protected queries defined', () => {
    const schema = buildSchema(typeDefs)
    const queryType = schema.getQueryType()!
    const fields = queryType.getFields()
    
    expect(fields.allNews).toBeDefined()
    expect(fields.reservations).toBeDefined()
    expect(fields.reservation).toBeDefined()
    expect(fields.users).toBeDefined()
  })

  it('schema has all mutations defined', () => {
    const schema = buildSchema(typeDefs)
    const mutationType = schema.getMutationType()!
    const fields = mutationType.getFields()
    
    expect(fields.login).toBeDefined()
    expect(fields.createReservation).toBeDefined()
    expect(fields.createNews).toBeDefined()
    expect(fields.updateNews).toBeDefined()
    expect(fields.deleteNews).toBeDefined()
    expect(fields.updateReservationStatus).toBeDefined()
    expect(fields.createUser).toBeDefined()
    expect(fields.deleteUser).toBeDefined()
  })

  it('schema has DateTime scalar defined', () => {
    const schema = buildSchema(typeDefs)
    const dateTimeType = schema.getType('DateTime')
    
    expect(dateTimeType).toBeDefined()
  })

  it('schema has all enums defined', () => {
    const schema = buildSchema(typeDefs)
    
    const reservationStatus = schema.getType('ReservationStatus')
    const userRole = schema.getType('UserRole')
    
    expect(reservationStatus).toBeDefined()
    expect(userRole).toBeDefined()
  })

  it('schema has input types defined', () => {
    const schema = buildSchema(typeDefs)
    
    const createReservationInput = schema.getType('CreateReservationInput')
    const createNewsInput = schema.getType('CreateNewsInput')
    const updateNewsInput = schema.getType('UpdateNewsInput')
    const createUserInput = schema.getType('CreateUserInput')
    
    expect(createReservationInput).toBeDefined()
    expect(createNewsInput).toBeDefined()
    expect(updateNewsInput).toBeDefined()
    expect(createUserInput).toBeDefined()
  })
})