import { authResolvers } from '../modules/auth/resolvers.js'
import { eventsResolvers } from '../modules/events/resolvers.js'
import { newsResolvers } from '../modules/news/resolvers.js'
import { productsResolvers } from '../modules/products/resolvers.js'
import { reservationsResolvers } from '../modules/reservations/resolvers.js'
import { dateTimeScalar } from '../modules/shared/scalars.js'
import { usersResolvers } from '../modules/users/resolvers.js'

export const resolvers = {
  DateTime: dateTimeScalar,
  Query: {
    ...authResolvers.Query,
    ...newsResolvers.Query,
    ...eventsResolvers.Query,
    ...productsResolvers.Query,
    ...reservationsResolvers.Query,
    ...usersResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...newsResolvers.Mutation,
    ...eventsResolvers.Mutation,
    ...productsResolvers.Mutation,
    ...reservationsResolvers.Mutation,
    ...usersResolvers.Mutation,
  },
  Product: {
    ...productsResolvers.Product,
  },
  ProductOption: {
    ...productsResolvers.ProductOption,
  },
  Role: {
    ...usersResolvers.Role,
  },
}

export default resolvers
