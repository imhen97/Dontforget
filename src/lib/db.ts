import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'
import { getRequestContext } from '@cloudflare/next-on-pages'

let _devPrisma: PrismaClient | null = null

function createPrisma(): PrismaClient {
  if (process.env.NODE_ENV === 'production') {
    const { env } = getRequestContext()
    if (env && (env as any).DB) {
      const adapter = new PrismaD1((env as any).DB)
      return new PrismaClient({ adapter } as any)
    }
  }
  if (!_devPrisma) {
    _devPrisma = new PrismaClient()
  }
  return _devPrisma
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop: string) {
    const client = createPrisma()
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})
