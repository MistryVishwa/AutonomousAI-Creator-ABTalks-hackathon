import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  // Use Vercel's pooled connection URL if available to prevent connection exhaustion
  const url = process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
  if (url) {
    return new PrismaClient({
      datasources: {
        db: {
          url: url,
        },
      },
    });
  }
  return new PrismaClient();
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
