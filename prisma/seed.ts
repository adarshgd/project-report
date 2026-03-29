import { PrismaClient } from '@prisma/client'
import bcrypt from "bcryptjs";

const prisma = new PrismaClient()

async function main() {
  // Clear existing users
  await prisma.user.deleteMany({});
  
  // Create default admin
  const hashedPassword = await bcrypt.hash("Adarsh@8680", 10);
  await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      role: 'admin'
    }
  });

  // Seed projects
  await prisma.project.create({
    data: {
      name: 'Alpha Marketing Event',
      totalCost: 150000,
      stage: 'In Talk',
      materialStatus: 'In Progress',
      status: 'In Progress',
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
