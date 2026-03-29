import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.project.create({
    data: {
      name: 'Alpha Marketing Event',
      totalCost: 150000,
      stage: 'In Talk',
      materialStatus: 'In Progress',
      notes: 'Initial discussion phase for the new product launch.',
      contents: {
        create: [
          { title: 'Stage setup', totalValue: 50000 },
          { title: 'Audio/Visual equipment', totalValue: 100000 }
        ]
      },
      mediators: {
        create: [
          { name: 'John Doe', amount: 5000 }
        ]
      },
      margins: {
        create: [
          {
            supplier: 'AV Corp',
            value: 50000,
            payment: 40000,
            sellingGst: 18,
            buyingGst: 18
          }
        ]
      }
    }
  })

  await prisma.project.create({
    data: {
      name: 'Beta TV Commercial',
      totalCost: 500000,
      stage: 'Deal Completed',
      materialStatus: 'Delivered',
      notes: 'Finalized contract for the commercial.',
    }
  })

  console.log('Seed completed successfully.')
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
