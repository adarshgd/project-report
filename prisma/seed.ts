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
          { description: 'Stage setup' },
          { description: 'Audio/Visual equipment' }
        ]
      },
      mediators: {
        create: [
          { name: 'John Doe', amount: 5000, notes: 'Contact for AV' }
        ]
      },
      marginLineItems: {
        create: [
          {
            itemService: 'Lighting',
            qty: 1,
            sellUnitPriceInclGst: 59000,
            sellGstPercent: 18,
            buyingAmountInclGst: 40000,
            buyGstPercent: 18,
            itcEligible: true
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
