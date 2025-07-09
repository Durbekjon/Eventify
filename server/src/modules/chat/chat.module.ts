import { Module } from '@nestjs/common'
import { ChatService } from './chat.service'
import { ChatGateway } from './chat.gateway'
import { PrismaService } from '@core/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { RoleService } from '@role/role.service'
import { UserService } from '@user/user.service'
import { UserRepository } from '@user/user.repository'

@Module({
  providers: [
    ChatService,
    ChatGateway,
    PrismaService,
    JwtService,
    RoleService,
    UserService,
    UserRepository,
  ],
})
export class ChatModule {}
