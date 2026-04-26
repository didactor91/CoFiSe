import { authResolvers } from '../modules/auth/resolvers.js'
import { competitionsResolvers } from '../modules/competitions/resolvers.js'
import { eventsResolvers } from '../modules/events/resolvers.js'
import { newsResolvers } from '../modules/news/resolvers.js'
import { productsResolvers } from '../modules/products/resolvers.js'
import { reservationsResolvers } from '../modules/reservations/resolvers.js'
import { dateTimeScalar } from '../modules/shared/scalars.js'
import { usersResolvers } from '../modules/users/resolvers.js'
import { uploadImageResolver } from '../routes/upload.js'

export const resolvers = {
  DateTime: dateTimeScalar,
  Query: {
    ...authResolvers.Query,
    ...competitionsResolvers.Query,
    ...newsResolvers.Query,
    ...eventsResolvers.Query,
    ...productsResolvers.Query,
    ...reservationsResolvers.Query,
    ...usersResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...competitionsResolvers.Mutation,
    ...newsResolvers.Mutation,
    ...eventsResolvers.Mutation,
    ...productsResolvers.Mutation,
    ...reservationsResolvers.Mutation,
    ...usersResolvers.Mutation,
    ...uploadImageResolver,
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
  ImageUploadResult: {
    __resolveType(obj: any) {
      if (obj.name && obj.description !== undefined) {
        if (obj.price !== undefined) return 'Product'
        if (obj.startTime !== undefined) return 'Event'
      }
      if (obj.title) return 'News'
      return 'Product'
    },
  },
  Competition: {
    ...competitionsResolvers.Competition,
  },
  Match: {
    ...competitionsResolvers.Match,
  },
}

export default resolvers
