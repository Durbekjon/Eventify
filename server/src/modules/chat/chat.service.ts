import { JWT_SECRET } from '@consts/token'
import { PrismaService } from '@core/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { RoleTypes, ViewType } from '@prisma/client'
import { RoleService } from '@role/role.service'
import { UserService } from '@user/user.service'

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly role: RoleService,
    private readonly user: UserService,
  ) {}

  validateToken(token: string) {
    return this.jwt.verify(token as string, {
      secret: JWT_SECRET,
    })
  }

  async hasAccessToChat(userId: string, chatId: string): Promise<boolean> {
    // Fetch user and chat data simultaneously to optimize performance
    const [user, chat] = await Promise.all([
      this.user.getUser(userId),
      this.prisma.chat.findUnique({
        where: { id: chatId },
        include: {
          task: { include: { members: true } },
        },
      }),
    ])

    // Return false if the chat or its associated task is missing
    if (!chat?.task) return false

    // Retrieve the user's role within the company
    const role = await this.role.getUserSelectedRole(user)
    // Check if the user's company matches the task's company
    if (role.companyId !== chat.task.companyId) return false
    // Grant access if the user holds an AUTHOR role
    if (role.type === RoleTypes.AUTHOR) return true

    // Validate access by checking if user is a task member or has all-access permissions
    const isMemberWithAccess = chat.task.members.some(
      (m) => m.id === role.access.id,
    )
    return isMemberWithAccess || role.access.view === ViewType.ALL
  }

  async getChatMessages(chatId: string) {
    return this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      include: { user: true },
    })
  }

  async createMessage(body: { chatId: string; userId: string; content: any }) {
    return this.prisma.message.create({
      data: {
        chat: { connect: { id: body.chatId } },
        user: { connect: { id: body.userId } },
        content: body.content,
      },
    })
  }
}
