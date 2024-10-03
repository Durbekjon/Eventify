import * as bcrypt from 'bcrypt'
import {
  PrismaClient,
  RoleTypes,
  MemberTypes,
  MemberPermissions,
  NotificationFrom,
  NotificationType,
  ViewType,
  MemberStatus,
} from '@prisma/client'
import { PASSWORD_SALT } from '../src/consts/password-salt'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.create({
    data: {
      firstName: 'Admin',
      lastName: 'Eventify',
      email: process.env.ADMIN_EMAIL,
      password: await bcrypt.hash(process.env.ADMIN_PASSWORD, PASSWORD_SALT),
      isAdmin: true,
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
  const sheet = await prisma.sheet.create({
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
