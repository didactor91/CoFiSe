import { GraphQLScalarType, Kind } from 'graphql'

export const dateTimeScalar = new GraphQLScalarType({
    name: 'DateTime',
    description: 'ISO-8601 DateTime scalar',
    serialize(value: unknown): string {
        if (value instanceof Date) return value.toISOString()
        if (typeof value === 'string') return value
        throw new Error('DateTime must be a Date or ISO string')
    },
    parseValue(value: unknown): string {
        if (typeof value === 'string') return value
        throw new Error('DateTime must be an ISO string')
    },
    parseLiteral(ast): string | null {
        if (ast.kind === Kind.STRING) return ast.value
        return null
    },
})
