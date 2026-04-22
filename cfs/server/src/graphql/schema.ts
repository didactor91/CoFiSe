import { gql } from 'graphql-tag'

export const typeDefs = gql`
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

  # Queries
  type Query {
    # Public
    news: [News!]!
    newsItem(id: ID!): News
    products: [Product!]!
    product(id: ID!): Product

    # Authenticated
    me: User

    # Staff or Admin
    allNews: [News!]!
    reservations(status: ReservationStatus): [Reservation!]!
    reservation(id: ID!): Reservation

    # Admin only
    users: [User!]!
  }

  # Mutations
  type Mutation {
    # Public
    createReservation(input: CreateReservationInput!): Reservation!
    login(email: String!, password: String!): AuthPayload!

    # News (Staff or Admin)
    createNews(input: CreateNewsInput!): News!
    updateNews(id: ID!, input: UpdateNewsInput!): News!
    deleteNews(id: ID!): Boolean!

    # Reservations (Staff or Admin)
    updateReservationStatus(id: ID!, status: ReservationStatus!): Reservation!

    # Admin only
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

export default typeDefs