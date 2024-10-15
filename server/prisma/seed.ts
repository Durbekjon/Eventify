import * as bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import { PASSWORD_SALT } from '../src/consts/password-salt'
import Stripe from 'stripe'

const stripe: Stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-09-30.acacia',
})

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

const prisma = new PrismaClient()
async function main() {
  try {
    const existData = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    })
    if (!existData) {
      const customer = await stripe.customers.create({
        email: ADMIN_EMAIL,
        name: 'Admin',
      })
      const user = await prisma.user.create({
        data: {
          firstName: 'Admin',
          lastName: 'Eventify',
          email: ADMIN_EMAIL,
          password: await bcrypt.hash(
            process.env.ADMIN_PASSWORD,
            PASSWORD_SALT,
          ),
          isAdmin: true,
          customerId: customer.id,
        },
      })

      const company = await prisma.company.create({
        data: {
          name: 'EVENTIFY',
          authorId: user.id,
        },
      })

      const role = await prisma.role.create({
        data: {
          company: {
            connect: { id: company.id },
          },
          user: {
            connect: { id: user.id },
          },
          type: 'AUTHOR',
        },
      })

      await prisma.user.update({
        where: { id: user.id },
        data: { selectedRole: role.id },
      })

      const workspace = await prisma.workspace.create({
        data: {
          name: 'companies',
          company: {
            connect: { id: company.id },
          },
        },
      })
      await prisma.sheet.create({
        data: {
          name: 'List of companies',
          company: {
            connect: { id: company.id },
          },
          workspace: {
            connect: { id: workspace.id },
          },
        },
      })
      await prisma.sheet.create({
        data: {
          name: 'Wedding list',
          company: {
            connect: { id: company.id },
          },
          workspace: {
            connect: { id: workspace.id },
          },
        },
      })
    }
    return
  } catch (error) {
    console.log(error)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    await prisma.$disconnect()
    process.exit(1)
  })
