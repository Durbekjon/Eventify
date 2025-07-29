import { Module } from '@nestjs/common'
import { ChatService } from './chat.service'
import { ChatGateway } from './chat.gateway'
import { PrismaService } from '@core/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { RoleService } from '@role/role.service'
import { UserModule } from '../user/user.module'

@Module({
  imports: [UserModule],
  providers: [ChatService, ChatGateway, PrismaService, JwtService, RoleService],
})
export class ChatModule {}
