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
    imageUrl: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Competition {
    id: ID!
    name: String!
    description: String
    matchType: MatchType!
    status: CompetitionStatus!
    participantCount: Int!
    participants: [Participant!]!
    matches: [Match!]!
    bracketNodes: [BracketNode!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Participant {
    id: ID!
    competitionId: ID!
    alias: String!
    createdAt: DateTime!
  }

  type Match {
    id: ID!
    competitionId: ID!
    round: Int!
    position: Int!
    participant1: Participant
    participant2: Participant
    homeScore1: Int
    homeScore2: Int
    awayScore1: Int
    awayScore2: Int
    winner: Participant
    status: MatchStatus!
    isBye: Boolean!
    nodeId: ID
    createdAt: DateTime!
  }

  type BracketNode {
    id: ID!
    competitionId: ID!
    round: Int!
    position: Int!
    teamAName: String
    teamBName: String
    nextNodeId: ID
    nextSlot: BracketSlot
    bracketLabel: BracketLabel
    isBye: Boolean!
    match: Match
    createdAt: DateTime!
  }

  enum EntityType {
    PRODUCT
    NEWS
    EVENT
  }

  enum MatchType {
    SINGLE_LEG
    HOME_AND_AWAY
  }

  enum TournamentFormat {
    FREE
    SINGLE_ELIMINATION
    HOME_AWAY
    DOUBLE_ELIMINATION
    ROUND_ROBIN
  }

  enum BracketLabel {
    WINNERS
    LOSERS
    GRAND_FINAL
  }

  enum BracketSlot {
    A
    B
  }

  enum CompetitionStatus {
    DRAFT
    ACTIVE
    COMPLETED
  }

  enum MatchStatus {
    PENDING
    COMPLETED
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

    # Competitions (Public)
    publicCompetitions: [Competition!]!
    publicCompetition(id: ID!): Competition

    # Competitions (Staff/Admin - includes DRAFT)
    competitions: [Competition!]!
    competition(id: ID!): Competition

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

    # Images (Staff or Admin)
    uploadImage(entityType: EntityType!, entityId: ID!): ImageUploadResult!

    # Competitions (Staff or Admin)
    createCompetition(input: CreateCompetitionInput!): Competition!
    updateCompetition(id: ID!, input: UpdateCompetitionInput!): Competition!
    deleteCompetition(id: ID!): Boolean!
    addParticipants(input: AddParticipantsInput!): Competition!
    generateBracket(competitionId: ID!): Competition!
    setMatchResult(input: SetMatchResultInput!): Match!

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

  union ImageUploadResult = Product | News | Event

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
  }

  input UpdateNewsInput {
    title: String
    content: String
  }

  input CreateProductInput {
    name: String!
    description: String!
    price: Float!
    stock: Int!
    limitedStock: Boolean!
  }

  input UpdateProductInput {
    name: String
    description: String
    price: Float
    stock: Int
    limitedStock: Boolean
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
    imageUrl: String
  }

  input UpdateEventInput {
    name: String
    description: String
    location: String
    startTime: DateTime
    endTime: DateTime
    imageUrl: String
  }

  input CreateCompetitionInput {
    name: String!
    description: String
    matchType: MatchType!
    participantCount: Int!
    format: TournamentFormat
  }

  input UpdateCompetitionInput {
    name: String
    description: String
    matchType: MatchType
    status: CompetitionStatus
  }

  input AddParticipantsInput {
    competitionId: ID!
    aliases: [String!]!
  }

  input SetMatchResultInput {
    matchId: ID!
    homeScore1: Int
    homeScore2: Int
    awayScore1: Int
    awayScore2: Int
    manualWinnerId: ID
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
