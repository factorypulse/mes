import { PrismaClient } from './generated/prisma'

const prisma = new PrismaClient()

async function main() {
  // ... you will write your Prisma Client queries here
  const test = await prisma.test.create({
    data: {
      title: 'Hello World',
    },
  })
  console.log(test)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
