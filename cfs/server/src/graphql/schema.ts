import { gql } from 'graphql-tag'

export const typeDefs = gql`
  scalar DateTime

  type News {
    id: ID!
    title: String!
    content: String!
    imageUrl: String
    published: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Product {
    id: ID!
    name: String!
    description: String!
    price: Float!
    stock: Int
    limitedStock: Boolean!
    imageUrl: String
    createdAt: DateTime!
    updatedAt: DateTime!
    options: [ProductOption!]!
  }

  type ProductOption {
    id: ID!
    productId: ID!
    name: String!
    required: Boolean!
    values: [OptionValue!]!
  }

  type OptionValue {
    id: ID!
    optionId: ID!
    value: String!
    stock: Int
  }

  type Event {
    id: ID!
    name: String!
    description: String
    location: String!
    startTime: DateTime!
    endTime: DateTime!
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
    items: [ReservationItem!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ReservationItem {
    id: ID!
    reservationId: ID!
    productId: ID!
    productName: String!
    optionValueId: ID
    optionValue: String
    quantity: Int!
    unitPrice: Float!
  }

  type ReservationProductTotal {
    productId: ID!
    productName: String!
    quantity: Int!
  }

  type ReservationSizeTotal {
    size: String!
    quantity: Int!
  }

  type ReservationMetrics {
    totalReservations: Int!
    totalUnits: Int!
    byProduct: [ReservationProductTotal!]!
    bySize: [ReservationSizeTotal!]!
  }

  enum ReservationStatus {
    PENDING_UNVERIFIED
    PENDING
    CONFIRMED
    CANCELLED
    COMPLETED
  }

  type User {
    id: ID!
    email: String!
    role: String!
    createdAt: DateTime!
  }

  type Role {
    id: ID!
    name: String!
    permissions: [String!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AuthPayload {
    token: String!
    refreshToken: String!
    user: User!
  }

  # Queries
  type Query {
    # Public
    news: [News!]!
    newsItem(id: ID!): News
    products: [Product!]!
    product(id: ID!): Product
    events: [Event!]!
    event(id: ID!): Event

    # Authenticated
    me: User

    # Staff or Admin
    allNews: [News!]!
    allEvents: [Event!]!
    reservations(status: ReservationStatus): [Reservation!]!
    reservationMetrics(status: ReservationStatus): ReservationMetrics!
    reservation(id: ID!): Reservation
    productOptions(productId: ID!): [ProductOption!]!

    # Admin only
    users: [User!]!
    roles: [Role!]!
  }

  # Mutations
  type Mutation {
    # Public
    createReservation(input: CreateReservationInput!): Reservation!
    login(email: String!, password: String!): AuthPayload!
    refreshToken(refreshToken: String!): AuthPayload!

    # News (Staff or Admin)
    createNews(input: CreateNewsInput!): News!
    updateNews(id: ID!, input: UpdateNewsInput!): News!
    publishNews(id: ID!): News!
    unpublishNews(id: ID!): News!
    deleteNews(id: ID!): Boolean!

    # Events (Staff or Admin)
    createEvent(input: CreateEventInput!): Event!
    updateEvent(id: ID!, input: UpdateEventInput!): Event!
    deleteEvent(id: ID!): Boolean!

    # Products (Staff or Admin)
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
    deleteProduct(id: ID!): Boolean!

    # Product Options (Staff or Admin)
    createProductOption(input: CreateProductOptionInput!): ProductOption!
    updateProductOption(id: ID!, input: UpdateProductOptionInput!): ProductOption!
    deleteProductOption(id: ID!): Boolean!
    addOptionValues(optionId: ID!, values: [OptionValueInput!]!): ProductOption!
    updateOptionValue(id: ID!, value: String, stock: Int): OptionValue!
    deleteOptionValue(id: ID!): Boolean!

    # Reservations (Staff or Admin)
    updateReservationStatus(id: ID!, status: ReservationStatus!): Reservation!
    updateReservation(id: ID!, input: UpdateReservationInput!): Reservation!

    # Admin only
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!
    createRole(input: CreateRoleInput!): Role!
    updateRole(id: ID!, input: UpdateRoleInput!): Role!
    deleteRole(id: ID!): Boolean!
  }

  input CreateReservationInput {
    productId: ID!
    quantity: Int!
    name: String!
    email: String!
    phone: String!
    notes: String
  }

  input UpdateReservationInput {
    name: String
    email: String
    phone: String
    notes: String
    items: [UpdateReservationItemInput!]
  }

  input UpdateReservationItemInput {
    productId: ID!
    quantity: Int!
    optionValueId: ID
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

  input CreateProductInput {
    name: String!
    description: String!
    price: Float!
    stock: Int!
    limitedStock: Boolean!
    imageUrl: String
  }

  input UpdateProductInput {
    name: String
    description: String
    price: Float
    stock: Int
    limitedStock: Boolean
    imageUrl: String
  }

  input CreateUserInput {
    email: String!
    password: String!
    role: String!
  }

  input UpdateUserInput {
    email: String
    role: String
  }

  input CreateRoleInput {
    name: String!
    permissions: [String!]!
  }

  input UpdateRoleInput {
    name: String
    permissions: [String!]
  }

  input CreateEventInput {
    name: String!
    description: String
    location: String!
    startTime: DateTime!
    endTime: DateTime!
  }

  input UpdateEventInput {
    name: String
    description: String
    location: String
    startTime: DateTime
    endTime: DateTime
  }

  input CreateProductOptionInput {
    productId: ID!
    name: String!
    required: Boolean!
  }

  input UpdateProductOptionInput {
    name: String
    required: Boolean
  }

  input OptionValueInput {
    value: String!
    stock: Int
  }
`

export default typeDefs
