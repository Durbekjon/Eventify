import * as bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import { PASSWORD_SALT } from '../src/consts/password-salt'
import Stripe from 'stripe'
import { config } from 'dotenv'
config() // Load environment variables from .env file

const stripe: Stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
})

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🌱 Starting database seeding...')

    // Create Stripe products and prices
    console.log('📦 Creating Stripe products and prices...')
    const products = await createStripeProducts()

    // Create plans
    console.log('💳 Creating subscription plans...')
    const plans = await createPlans(products)

    // Create admin user and company
    console.log('👤 Creating admin user and company...')
    const adminData = await createAdminUser()

    // Create sample companies and users
    console.log('🏢 Creating sample companies and users...')
    await createSampleCompanies(adminData.user, plans)

    // Create sample workspaces and sheets
    console.log('📋 Creating sample workspaces and sheets...')
    await createSampleWorkspaces()

    // Create sample tasks and columns
    console.log('✅ Creating sample tasks and columns...')
    await createSampleTasks()

    // Create sample members
    console.log('👥 Creating sample members...')
    await createSampleMembers()

    // Create sample notifications
    console.log('🔔 Creating sample notifications...')
    await createSampleNotifications()

    // Create sample payment logs
    console.log('💰 Creating sample payment logs...')
    await createSamplePaymentLogs()

    console.log('✅ Database seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  }
}

async function createStripeProducts() {
  const products = []

  // Free Plan Product
  const freeProduct = await stripe.products.create({
    name: 'Eventify Free',
    description: 'Free plan for basic task management',
  })

  const freePrice = await stripe.prices.create({
    product: freeProduct.id,
    unit_amount: 0,
    currency: 'usd',
    recurring: { interval: 'month' },
  })

  products.push({
    name: 'Free',
    stripeProductId: freeProduct.id,
    stripePriceId: freePrice.id,
    maxTasks: 30,
  })

  // Pro Plan Product
  const proProduct = await stripe.products.create({
    name: 'Eventify Pro',
    description: 'Professional plan with advanced features',
  })

  const proPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 2900, // $29.00
    currency: 'usd',
    recurring: { interval: 'month' },
  })

  products.push({
    name: 'Pro',
    stripeProductId: proProduct.id,
    stripePriceId: proPrice.id,
    maxTasks: 100,
  })

  // Business Plan Product
  const businessProduct = await stripe.products.create({
    name: 'Eventify Business',
    description: 'Business plan for teams and organizations',
  })

  const businessPrice = await stripe.prices.create({
    product: businessProduct.id,
    unit_amount: 9900, // $99.00
    currency: 'usd',
    recurring: { interval: 'month' },
  })

  products.push({
    name: 'Business',
    stripeProductId: businessProduct.id,
    stripePriceId: businessPrice.id,
    maxTasks: 1000,
  })

  // Enterprise Plan Product
  const enterpriseProduct = await stripe.products.create({
    name: 'Eventify Enterprise',
    description: 'Enterprise plan for large organizations',
  })

  const enterprisePrice = await stripe.prices.create({
    product: enterpriseProduct.id,
    unit_amount: 29900, // $299.00
    currency: 'usd',
    recurring: { interval: 'month' },
  })

  products.push({
    name: 'Enterprise',
    stripeProductId: enterpriseProduct.id,
    stripePriceId: enterprisePrice.id,
    maxTasks: 10000,
  })

  return products
}

async function createPlans(products: any[]) {
  const plans = []

  // Free Plan
  const freePlan = await prisma.plan.create({
    data: {
      name: 'Free',
      description: 'Perfect for individuals and small teams',
      price: 0,
      maxWorkspaces: 1,
      maxSheets: 3,
      maxMembers: 2,
      maxViewers: 2,
      maxTasks: 30,
      stripePriceId: products[0].stripePriceId,
    },
  })
  plans.push(freePlan)

  // Pro Plan
  const proPlan = await prisma.plan.create({
    data: {
      name: 'Pro',
      description: 'Advanced features for growing teams',
      price: 29,
      maxWorkspaces: 5,
      maxSheets: 20,
      maxMembers: 10,
      maxViewers: 10,
      maxTasks: 100,
      stripePriceId: products[1].stripePriceId,
    },
  })
  plans.push(proPlan)

  // Business Plan
  const businessPlan = await prisma.plan.create({
    data: {
      name: 'Business',
      description: 'Complete solution for organizations',
      price: 99,
      maxWorkspaces: 20,
      maxSheets: 100,
      maxMembers: 50,
      maxViewers: 50,
      maxTasks: 1000,
      stripePriceId: products[2].stripePriceId,
    },
  })
  plans.push(businessPlan)

  // Enterprise Plan
  const enterprisePlan = await prisma.plan.create({
    data: {
      name: 'Enterprise',
      description: 'Custom solution for large enterprises',
      price: 299,
      maxWorkspaces: -1, // Unlimited
      maxSheets: -1, // Unlimited
      maxMembers: -1, // Unlimited
      maxViewers: -1, // Unlimited
      maxTasks: -1, // Unlimited
      stripePriceId: products[3].stripePriceId,
    },
  })
  plans.push(enterprisePlan)

  return plans
}

async function createAdminUser() {
  const existData = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  })

  if (!existData) {
    const customer = await stripe.customers.create({
      email: ADMIN_EMAIL,
      name: 'Admin Eventify',
    })

    const user = await prisma.user.create({
      data: {
        firstName: 'Admin',
        lastName: 'Eventify',
        email: ADMIN_EMAIL,
        password: await bcrypt.hash(process.env.ADMIN_PASSWORD, PASSWORD_SALT),
        isAdmin: true,
        customerId: customer.id,
      },
    })

    const company = await prisma.company.create({
      data: {
        name: 'EVENTIFY',
        authorId: user.id,
        stripeCustomerId: customer.id,
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

    return { user, company, role }
  }

  return { user: existData, company: null, role: null }
}

async function createSampleCompanies(adminUser: any, plans: any[]) {
  const companies = [
    {
      name: 'TechCorp Solutions',
      planId: plans[1].id, // Pro plan
    },
    {
      name: 'EventPro Services',
      planId: plans[2].id, // Business plan
    },
    {
      name: 'StartupHub Inc',
      planId: plans[0].id, // Free plan
    },
    {
      name: 'Global Enterprises',
      planId: plans[3].id, // Enterprise plan
    },
  ]

  for (const companyData of companies) {
    const customer = await stripe.customers.create({
      email: `${companyData.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
      name: companyData.name,
    })

    const company = await prisma.company.create({
      data: {
        name: companyData.name,
        authorId: adminUser.id,
        planId: companyData.planId,
        stripeCustomerId: customer.id,
      },
    })

    // Create subscription for paid plans (without actual Stripe subscription for seeding)
    if (companyData.planId !== plans[0].id) {
      // Not free plan
      await prisma.companySubscription.create({
        data: {
          companyId: company.id,
          planId: companyData.planId,
          stripeSubscriptionId: `sub_test_${company.id}`, // Mock subscription ID
          stripeItemId: `si_test_${company.id}`, // Mock item ID
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          isExpired: false,
          status: 'ACTIVE',
          requestsCount: 0,
        },
      })
    }

    // Create sample users for each company
    await createSampleUsersForCompany(company, adminUser)
  }
}

async function createSampleUsersForCompany(company: any, adminUser: any) {
  const users = [
    {
      firstName: 'John',
      lastName: 'Manager',
      email: `manager.${company.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
      type: 'AUTHOR' as const,
    },
    {
      firstName: 'Sarah',
      lastName: 'Coordinator',
      email: `coordinator.${company.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
      type: 'MEMBER' as const,
    },
    {
      firstName: 'Mike',
      lastName: 'Assistant',
      email: `assistant.${company.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
      type: 'VIEWER' as const,
    },
  ]

  for (const userData of users) {
    const customer = await stripe.customers.create({
      email: userData.email,
      name: `${userData.firstName} ${userData.lastName}`,
    })

    const user = await prisma.user.create({
      data: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: await bcrypt.hash('password123', PASSWORD_SALT),
        customerId: customer.id,
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
        type: userData.type,
      },
    })

    // Set selected role for the first user
    if (userData.type === 'AUTHOR') {
      await prisma.user.update({
        where: { id: user.id },
        data: { selectedRole: role.id },
      })
    }
  }
}

async function createSampleWorkspaces() {
  const companies = await prisma.company.findMany()

  for (const company of companies) {
    const workspaces = [
      {
        name: 'Project Management',
      },
      {
        name: 'Marketing',
      },
      {
        name: 'Development',
      },
      {
        name: 'Customer Support',
      },
    ]

    for (const workspaceData of workspaces) {
      const workspace = await prisma.workspace.create({
        data: {
          name: workspaceData.name,
          company: {
            connect: { id: company.id },
          },
        },
      })

      // Create sheets for each workspace
      await createSampleSheets(workspace, company)
    }
  }
}

async function createSampleSheets(workspace: any, company: any) {
  const sheetTemplates = [
    {
      name: 'Task Backlog',
    },
    {
      name: 'In Progress',
    },
    {
      name: 'Review',
    },
    {
      name: 'Completed',
    },
  ]

  for (const sheetData of sheetTemplates) {
    const sheet = await prisma.sheet.create({
      data: {
        name: sheetData.name,
        company: {
          connect: { id: company.id },
        },
        workspace: {
          connect: { id: workspace.id },
        },
      },
    })

    // Create columns for each sheet
    await createSampleColumns(sheet)
  }
}

async function createSampleColumns(sheet: any) {
  const columnTemplates = [
    {
      name: 'To Do',
      key: 'todo',
      type: 'TEXT' as const,
      order: 1,
    },
    {
      name: 'In Progress',
      key: 'in_progress',
      type: 'TEXT' as const,
      order: 2,
    },
    {
      name: 'Review',
      key: 'review',
      type: 'TEXT' as const,
      order: 3,
    },
    {
      name: 'Done',
      key: 'done',
      type: 'TEXT' as const,
      order: 4,
    },
  ]

  for (const columnData of columnTemplates) {
    await prisma.column.create({
      data: {
        name: columnData.name,
        key: columnData.key,
        type: columnData.type,
        companyId: sheet.companyId,
        sheetId: sheet.id,
      },
    })
  }
}

async function createSampleTasks() {
  const sheets = await prisma.sheet.findMany({
    include: {
      columns: true,
    },
  })

  const taskTemplates = [
    {
      name: 'Design new landing page',
      priority: 'HIGH',
      workspaceId: '', // Will be set
      sheetId: '', // Will be set
      companyId: '', // Will be set
    },
    {
      name: 'Implement user authentication',
      priority: 'MEDIUM',
      workspaceId: '', // Will be set
      sheetId: '', // Will be set
      companyId: '', // Will be set
    },
    {
      name: 'Write API documentation',
      priority: 'LOW',
      workspaceId: '', // Will be set
      sheetId: '', // Will be set
      companyId: '', // Will be set
    },
    {
      name: 'Setup CI/CD pipeline',
      priority: 'HIGH',
      workspaceId: '', // Will be set
      sheetId: '', // Will be set
      companyId: '', // Will be set
    },
    {
      name: 'Conduct user testing',
      priority: 'MEDIUM',
      workspaceId: '', // Will be set
      sheetId: '', // Will be set
      companyId: '', // Will be set
    },
  ]

  for (const sheet of sheets) {
    for (let i = 0; i < taskTemplates.length; i++) {
      const taskData = taskTemplates[i]

      await prisma.task.create({
        data: {
          name: taskData.name,
          priority: taskData.priority,
          workspaceId: sheet.workspaceId,
          sheetId: sheet.id,
          companyId: sheet.companyId,
          order: i + 1,
        },
      })
    }
  }
}

async function createSampleMembers() {
  const companies = await prisma.company.findMany()

  for (const company of companies) {
    const members = [
      {
        type: 'MEMBER' as const,
        permissions: ['ALL' as const],
        view: 'ALL' as const,
        status: 'NEW' as const,
        userId: '', // Will be set
        companyId: company.id,
      },
      {
        type: 'MEMBER' as const,
        permissions: ['ALL' as const],
        view: 'ALL' as const,
        status: 'ACTIVE' as const,
        userId: '', // Will be set
        companyId: company.id,
      },
      {
        type: 'VIEWER' as const,
        permissions: ['READ' as const],
        view: 'ALL' as const,
        status: 'NEW' as const,
        userId: '', // Will be set
        companyId: company.id,
      },
    ]

    // Get users for this company
    const users = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            companyId: company.id,
          },
        },
      },
      take: 3,
    })

    for (let i = 0; i < Math.min(members.length, users.length); i++) {
      const memberData = members[i]
      const user = users[i]

      await prisma.member.create({
        data: {
          type: memberData.type,
          permissions: memberData.permissions,
          view: memberData.view,
          status: memberData.status,
          userId: user.id,
          companyId: memberData.companyId,
        },
      })
    }
  }
}

async function createSampleNotifications() {
  const users = await prisma.user.findMany({
    take: 10, // Limit to first 10 users
  })

  const notificationTemplates = [
    {
      text: 'Welcome to Eventify! Thank you for joining our platform. Get started by creating your first workspace.',
      type: 'NOTIFICATION' as const,
      from: 'APPLICATION_TEAM' as const,
    },
    {
      text: 'You have been assigned a new task: "Design new landing page"',
      type: 'NOTIFICATION' as const,
      from: 'COMPANY' as const,
    },
    {
      text: 'Your subscription has been upgraded to Pro plan',
      type: 'NOTIFICATION' as const,
      from: 'APPLICATION_TEAM' as const,
    },
    {
      text: 'Your payment of $29.00 has been processed successfully',
      type: 'NOTIFICATION' as const,
      from: 'APPLICATION_TEAM' as const,
    },
  ]

  for (const user of users) {
    for (let i = 0; i < notificationTemplates.length; i++) {
      const notificationData = notificationTemplates[i]

      await prisma.notification.create({
        data: {
          text: notificationData.text,
          type: notificationData.type,
          from: notificationData.from,
          isRead: Math.random() > 0.5, // Random read status
          userId: user.id,
        },
      })
    }
  }
}

async function createSamplePaymentLogs() {
  const companies = await prisma.company.findMany({
    include: {
      subscriptions: true,
    },
  })

  for (const company of companies) {
    if (company.subscriptions.length > 0) {
      const subscription = company.subscriptions[0]

      // Create sample payment logs
      const paymentLogs = [
        {
          event: 'PAYMENT_SUCCESS',
          amount: 2900, // $29.00
          currency: 'usd',
          status: 'SUCCEEDED',
        },
        {
          event: 'SUBSCRIPTION_CREATED',
          amount: 0,
          currency: 'usd',
          status: 'SUCCEEDED',
        },
        {
          event: 'PAYMENT_FAILED',
          amount: 2900,
          currency: 'usd',
          status: 'FAILED',
        },
      ]

      for (const logData of paymentLogs) {
        await prisma.paymentLog.create({
          data: {
            event: logData.event,
            amount: logData.amount,
            currency: logData.currency,
            status: logData.status,
            metadata: JSON.stringify({
              companyId: company.id,
              subscriptionId: subscription.id,
              timestamp: new Date().toISOString(),
            }),
            companyId: company.id,
            subscriptionId: subscription.id,
            userId: company.authorId,
          },
        })
      }
    }
  }
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
