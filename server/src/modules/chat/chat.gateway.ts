import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Injectable } from '@nestjs/common'
import { HTTP_MESSAGES } from '@consts/http-messages'
import { ChatService } from './chat.service'
import { SOCKET_OPTIONS } from '@consts/socket-options'

interface OnlineUser {
  chatId: string
  user: { id: string }
}

@Injectable()
@WebSocketGateway(4002, {
  namespace: 'chat',
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection<Socket> {
  @WebSocketServer() server: Server

  private onlineUsers: OnlineUser[] = []

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket): Promise<void> {
    const { token, chatId } = client.handshake.query as {
      token?: string
      chatId?: string
    }

    if (!token || !chatId) {
      client.disconnect()
      return
    }

    try {
      const decoded = await this.chatService.validateToken(token)
      if (!decoded) throw new WsException(HTTP_MESSAGES.AUTH.INVALID_TOKEN)

      //checking access
      const hasAccess = await this.chatService.hasAccessToChat(
        decoded.id,
        chatId,
      )
      if (!hasAccess) {
        client.emit(SOCKET_OPTIONS.ERROR, HTTP_MESSAGES.GENERAL.ACCESS_DENIED)
        client.disconnect()
        return
      }

      this.addUserToChat({ chatId, user: decoded })
      this.setCurrentUser(decoded, token)
      this.getMessages(chatId)
      this.emitOnlineUsersInChat(chatId)
    } catch (error) {
      client.emit(
        SOCKET_OPTIONS.ERROR,
        error instanceof WsException ? error.message : 'An error occurred',
      )
      client.disconnect()
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const { chatId, user } = client.handshake.query as {
      chatId?: string
      user?: { id: string }
    }

    if (chatId && user?.id) {
      this.onlineUsers = this.onlineUsers.filter(
        (onlineUser) =>
          onlineUser.chatId !== chatId || onlineUser.user.id !== user.id,
      )
      this.emitOnlineUsersInChat(chatId)
    }
  }

  async setCurrentUser(user: any, token: string) {
    this.server.emit('USER_DATA:token_' + token, user)
    return
  }

  @SubscribeMessage(SOCKET_OPTIONS.CHAT_MESSAGE)
  async handleMessage(client: Socket, payload: any): Promise<void> {
    const { token, chatId } = client.handshake.query as {
      token?: string
      chatId?: string
    }

    // Disconnect immediately if token or chatId is missing
    if (!token || !chatId) {
      client.disconnect()
      return
    }

    try {
      // Validate the user's token and ensure user exists
      const user = await this.chatService.validateToken(token)
      if (!user) throw new WsException(HTTP_MESSAGES.AUTH.INVALID_TOKEN)

      // Check user's access to the chat
      const hasAccess = await this.chatService.hasAccessToChat(user.id, chatId)
      if (!hasAccess) {
        client.emit(SOCKET_OPTIONS.ERROR, HTTP_MESSAGES.GENERAL.ACCESS_DENIED)
        client.disconnect()
        return
      }

      // If user has access, create the message and emit it to the chat room
      await this.chatService.createMessage({
        chatId,
        userId: user.id,
        content: payload.content,
      })
      const messages = await this.chatService.getChatMessages(chatId)
      this.server.emit(SOCKET_OPTIONS.MESSAGES_IN_CHAT + chatId, messages)
    } catch (error) {
      // Emit specific error message and disconnect if validation fails
      client.emit(
        SOCKET_OPTIONS.ERROR,
        error instanceof WsException
          ? error.message
          : HTTP_MESSAGES.GENERAL.FAILURE,
      )
      client.disconnect()
    }
  }

  private addUserToChat({ chatId, user }: OnlineUser): void {
    const isUserAlreadyOnline = this.onlineUsers.some(
      (onlineUser) =>
        onlineUser.user.id === user.id && onlineUser.chatId === chatId,
    )

    if (!isUserAlreadyOnline) {
      this.onlineUsers.push({ chatId, user })
    }
  }

  private async getMessages(chatId: string) {
    const messages = await this.chatService.getChatMessages(chatId)
    this.server.emit(SOCKET_OPTIONS.MESSAGES_IN_CHAT + chatId, messages)
    return
  }

  private emitOnlineUsersInChat(chatId: string): void {
    const onlineUsersInChat = this.onlineUsers.filter(
      (onlineUser) => onlineUser.chatId === chatId,
    )
    this.server.emit(
      SOCKET_OPTIONS.ONLINE_USERS_IN_CHAT + chatId,
      onlineUsersInChat,
    )
  }
}
