import {
  OnGatewayConnection,
  OnGatewayDisconnect,
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
import { IUser } from '@user/dto/IUser'

// interface OnlineUser {
//   chatId: string
//   user: IUser
//   socketId: string
// }

interface AuthenticatedSocket extends Socket {
  userId?: string
  chatId?: string
  userData?: IUser
}

@Injectable()
@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: '*',
  },
})
export class ChatGateway
  implements
    OnGatewayConnection<AuthenticatedSocket>,
    OnGatewayDisconnect<AuthenticatedSocket>
{
  @WebSocketServer() server: Server

  // Map to track online users by chat ID for efficient lookups
  private onlineUsersByChat: Map<string, Map<string, IUser>> = new Map()
  // Map to track which chat each socket is in
  private socketToChatMap: Map<string, string> = new Map()

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    const { token, chatId } = client.handshake.query as {
      token?: string
      chatId?: string
    }
    console.log('token', token)
    console.log('chatId', chatId)

    if (!token || !chatId) {
      client.emit(SOCKET_OPTIONS.ERROR, HTTP_MESSAGES.AUTH.INVALID_TOKEN)
      client.disconnect()
      return
    }

    try {
      const decoded = await this.chatService.validateToken(token)
      if (!decoded) {
        throw new WsException(HTTP_MESSAGES.AUTH.INVALID_TOKEN)
      }

      // Check access to chat
      const hasAccess = await this.chatService.hasAccessToChat(
        decoded.id,
        chatId,
      )
      console.log('hasAccess', hasAccess)
      if (!hasAccess) {
        client.emit(SOCKET_OPTIONS.ERROR, HTTP_MESSAGES.GENERAL.ACCESS_DENIED)
        client.disconnect()
        return
      }

      // Get detailed user data
      const detailedUser = await this.chatService.getUserData(decoded.id)

      // Store user data on socket for easy access
      client.userId = decoded.id
      client.chatId = chatId
      client.userData = detailedUser

      // Join the socket to the chat room
      await client.join(`chat_${chatId}`)

      // Add user to online users tracking
      this.addUserToChat(chatId, detailedUser)

      // Track socket to chat mapping
      this.socketToChatMap.set(client.id, chatId)

      // Send user data
      this.setCurrentUser(detailedUser, token)

      // Send initial messages
      await this.sendMessagesToChat(chatId)

      // Emit updated online users to the specific chat room
      this.emitOnlineUsersInChat(chatId)

      console.log(`User ${detailedUser.id} connected to chat ${chatId}`)
    } catch (error) {
      const errorMessage =
        error instanceof WsException
          ? error.message
          : HTTP_MESSAGES.GENERAL.FAILURE

      client.emit(SOCKET_OPTIONS.ERROR, errorMessage)
      client.disconnect()
    }
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    const { userId, chatId } = client
    const socketId = client.id

    if (!chatId || !userId) {
      return
    }

    try {
      // Remove user from chat tracking
      this.removeUserFromChat(chatId, userId)

      // Remove from socket tracking
      this.socketToChatMap.delete(socketId)

      // Leave the room
      await client.leave(`chat_${chatId}`)

      // Emit updated online users to the chat room
      this.emitOnlineUsersInChat(chatId)

      console.log(`User ${userId} disconnected from chat ${chatId}`)
    } catch (error) {
      console.error('Error handling disconnect:', error)
    }
  }

  async setCurrentUser(user: IUser, token: string): Promise<void> {
    this.server.emit('USER_DATA:token_' + token, user)
  }

  @SubscribeMessage(SOCKET_OPTIONS.CHAT_MESSAGE)
  async handleMessage(
    client: AuthenticatedSocket,
    payload: any,
  ): Promise<void> {
    const { userId, chatId, userData } = client

    if (!userId || !chatId || !userData) {
      client.emit(SOCKET_OPTIONS.ERROR, HTTP_MESSAGES.AUTH.INVALID_TOKEN)
      client.disconnect()
      return
    }

    try {
      // Validate payload
      if (!payload?.content || typeof payload.content !== 'string') {
        client.emit(SOCKET_OPTIONS.ERROR, 'Invalid message content')
        return
      }

      // Re-verify access (optional, for extra security)
      const hasAccess = await this.chatService.hasAccessToChat(userId, chatId)
      if (!hasAccess) {
        client.emit(SOCKET_OPTIONS.ERROR, HTTP_MESSAGES.GENERAL.ACCESS_DENIED)
        client.disconnect()
        return
      }

      // Create and save the message
      await this.chatService.createMessage({
        chatId,
        userId,
        content: payload.content.trim(),
      })

      // Send updated messages to all users in the chat room
      await this.sendMessagesToChat(chatId)
    } catch (error) {
      const errorMessage =
        error instanceof WsException
          ? error.message
          : HTTP_MESSAGES.GENERAL.FAILURE

      client.emit(SOCKET_OPTIONS.ERROR, errorMessage)
      console.error('Error handling message:', error)
    }
  }

  private addUserToChat(chatId: string, user: IUser): void {
    if (!this.onlineUsersByChat.has(chatId)) {
      this.onlineUsersByChat.set(chatId, new Map())
    }

    const chatUsers = this.onlineUsersByChat.get(chatId)!
    chatUsers.set(user.id, user)
  }

  private removeUserFromChat(
    chatId: string,
    userId: string,
    // socketId: string,
  ): void {
    const chatUsers = this.onlineUsersByChat.get(chatId)
    if (!chatUsers) return

    // Simple approach: always remove user on disconnect
    // If you need multi-connection support, you'll need additional tracking
    chatUsers.delete(userId)

    // Clean up empty chat entries
    if (chatUsers.size === 0) {
      this.onlineUsersByChat.delete(chatId)
    }
  }

  private async sendMessagesToChat(chatId: string): Promise<void> {
    try {
      const messages = await this.chatService.getChatMessages(chatId)
      // Emit to specific chat room instead of all connected clients
      this.server
        .to(`chat_${chatId}`)
        .emit(SOCKET_OPTIONS.MESSAGES_IN_CHAT + chatId, messages)
    } catch (error) {
      console.error('Error sending messages to chat:', error)
    }
  }

  private emitOnlineUsersInChat(chatId: string): void {
    const chatUsers = this.onlineUsersByChat.get(chatId)
    if (!chatUsers) return

    const onlineUsersArray = Array.from(chatUsers.values())

    // Emit to specific chat room only
    this.server
      .to(`chat_${chatId}`)
      .emit(SOCKET_OPTIONS.ONLINE_USERS_IN_CHAT + chatId, onlineUsersArray)
  }

  // Helper method to get online users for a specific chat (for debugging/admin purposes)
  getOnlineUsersInChat(chatId: string): IUser[] {
    const chatUsers = this.onlineUsersByChat.get(chatId)
    return chatUsers ? Array.from(chatUsers.values()) : []
  }

  // Helper method to get total online users count across all chats
  getTotalOnlineUsersCount(): number {
    let total = 0
    for (const chatUsers of this.onlineUsersByChat.values()) {
      total += chatUsers.size
    }
    return total
  }
}
