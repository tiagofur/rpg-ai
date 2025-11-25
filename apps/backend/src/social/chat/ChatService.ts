import { EventEmitter } from 'node:events';
import { IChatMessage, IChatRoom, RoomType, MessageType } from '../interfaces/IChat.js';
import { IWebSocketManager } from '../../websocket/interfaces/IWebSocketManager.js';
import { IRedisClient } from '../../cache/interfaces/IRedisClient.js';
import { GameError, ErrorCode } from '../../errors/GameError.js';
import { ILogger } from '../../logging/interfaces/ILogger.js';

export interface IChatService {
  createRoom(roomData: Partial<IChatRoom>): Promise<IChatRoom>;
  joinRoom(roomId: string, userId: string): Promise<void>;
  leaveRoom(roomId: string, userId: string): Promise<void>;
  sendMessage(roomId: string, userId: string, content: string, messageType?: MessageType): Promise<IChatMessage>;
  getRoomMessages(roomId: string, limit?: number, before?: Date): Promise<Array<IChatMessage>>;
  getUserRooms(userId: string): Promise<Array<IChatRoom>>;
  deleteMessage(roomId: string, messageId: string, userId: string): Promise<void>;
  moderateMessage(roomId: string, messageId: string, moderatorId: string, action: 'delete' | 'warn' | 'ban'): Promise<void>;
}

export interface IChatEvent {
  type: string;
  data: Record<string, unknown>;
}

export class ChatService extends EventEmitter implements IChatService {
  private readonly ROOM_KEY = 'chat:room:';

  private readonly ROOM_MEMBERS_KEY = 'chat:room:members:';

  private readonly ROOM_MESSAGES_KEY = 'chat:room:messages:';

  private readonly USER_ROOMS_KEY = 'chat:user:rooms:';

  private readonly MESSAGE_MODERATION_KEY = 'chat:moderation:';

  private readonly MAX_MESSAGES_PER_ROOM = 1000;

  private readonly MAX_MESSAGE_LENGTH = 1000;

  private readonly RATE_LIMIT_MESSAGES_PER_MINUTE = 30;

  public constructor(
    private readonly websocketManager: IWebSocketManager,
    private readonly redis: IRedisClient,
    private readonly logger: ILogger
  ) {
    super();
  }

  public async createRoom(roomData: Partial<IChatRoom>): Promise<IChatRoom> {
    try {
      const roomId = this.generateRoomId();
      const room: IChatRoom = {
        id: roomId,
        name: roomData.name || `Room ${roomId}`,
        description: roomData.description || '',
        type: roomData.type || RoomType.GLOBAL,
        maxMembers: roomData.maxMembers || 100,
        ownerId: roomData.ownerId!,
        moderators: [],
        members: [],
        memberCount: 0,
        isPrivate: roomData.isPrivate || false,
        ...(roomData.password ? { password: roomData.password } : {}),
        lastActivity: new Date(),
        metadata: roomData.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Validate room data
      this.validateRoomData(room);

      // Save room
      const roomKey = `${this.ROOM_KEY}${roomId}`;
      await this.redis.setex(roomKey, 86_400, JSON.stringify(room)); // 24 hour TTL

      // Creator automatically joins the room
      await this.joinRoom(roomId, room.ownerId);

      this.logger.info('Chat room created', { roomId, creatorId: room.ownerId });

      return room;
    } catch (error) {
      this.logger.error('Error creating chat room', { roomData, error });
      throw new GameError(
        'Failed to create chat room',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500
      );
    }
  }

  public async joinRoom(roomId: string, userId: string): Promise<void> {
    try {
      // Check if room exists
      const room = await this.getRoom(roomId);
      if (!room) {
        throw new GameError(
          'Chat room not found',
          ErrorCode.RESOURCE_NOT_FOUND,
          404
        );
      }

      // Check if room is full
      if (room.memberCount >= room.maxMembers) {
        throw new GameError(
          'Chat room is full',
          ErrorCode.RESOURCE_CONFLICT,
          409
        );
      }

      // Check if user is already in room
      const isMember = await this.isRoomMember(roomId, userId);
      if (isMember) {
        throw new GameError(
          'Already a member of this room',
          ErrorCode.RESOURCE_CONFLICT,
          409
        );
      }

      // Add user to room
      await this.addRoomMember(roomId, userId);

      // Update room member count
      room.memberCount++;
      room.lastActivity = new Date();
      await this.updateRoom(room);

      // Add room to user's room list
      await this.addUserRoom(userId, roomId);

      // Send join notification to room
      await this.broadcastRoomEvent(roomId, {
        type: 'user_joined',
        data: { userId, roomId, timestamp: new Date() }
      });

      this.logger.info('User joined chat room', { roomId, userId });
    } catch (error) {
      if (error instanceof GameError) {
        throw error;
      }
      this.logger.error('Error joining chat room', { roomId, userId, error });
      throw new GameError(
        'Failed to join chat room',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500
      );
    }
  }

  public async leaveRoom(roomId: string, userId: string): Promise<void> {
    try {
      // Check if user is in room
      const isMember = await this.isRoomMember(roomId, userId);
      if (!isMember) {
        throw new GameError(
          'Not a member of this room',
          ErrorCode.RESOURCE_NOT_FOUND,
          404
        );
      }

      // Remove user from room
      await this.removeRoomMember(roomId, userId);

      // Update room member count
      const room = await this.getRoom(roomId);
      if (room) {
        room.memberCount = Math.max(0, room.memberCount - 1);
        room.lastActivity = new Date();
        await this.updateRoom(room);
      }

      // Remove room from user's room list
      await this.removeUserRoom(userId, roomId);

      // Send leave notification to room
      await this.broadcastRoomEvent(roomId, {
        type: 'user_left',
        data: { userId, roomId, timestamp: new Date() }
      });

      this.logger.info('User left chat room', { roomId, userId });
    } catch (error) {
      if (error instanceof GameError) {
        throw error;
      }
      this.logger.error('Error leaving chat room', { roomId, userId, error });
      throw new GameError(
        'Failed to leave chat room',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500
      );
    }
  }

  public async sendMessage(roomId: string, userId: string, content: string, messageType: MessageType = MessageType.TEXT): Promise<IChatMessage> {
    try {
      // Validate message
      this.validateMessage(content, messageType);

      // Check rate limiting
      await this.checkRateLimit(userId);

      // Check if user is in room
      const isMember = await this.isRoomMember(roomId, userId);
      if (!isMember) {
        throw new GameError(
          'Not a member of this room',
          ErrorCode.FORBIDDEN,
          403
        );
      }

      // Create message
      const message: IChatMessage = {
        id: this.generateMessageId(),
        roomId,
        userId,
        username: `User_${userId.slice(0, 8)}`, // Temporary username
        content: this.sanitizeContent(content),
        type: messageType,
        timestamp: new Date(),
        edited: false,
        deleted: false,
        reactions: {},
        metadata: {}
      };

      // Check for moderation
      const moderationResult = await this.checkMessageContent(message);
      if (moderationResult.action === 'block') {
        throw new GameError(
          'Message blocked by moderation',
          ErrorCode.FORBIDDEN,
          403
        );
      }

      // Save message
      await this.saveMessage(message);

      // Broadcast message to room
      await this.broadcastMessage(roomId, message);

      // Update room last activity
      await this.updateRoomActivity(roomId);

      this.logger.debug('Chat message sent', { roomId, userId, messageId: message.id });

      return message;
    } catch (error) {
      if (error instanceof GameError) {
        throw error;
      }
      this.logger.error('Error sending chat message', { roomId, userId, error });
      throw new GameError(
        'Failed to send chat message',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500
      );
    }
  }

  public async getRoomMessages(roomId: string, limit: number = 50, before?: Date): Promise<Array<IChatMessage>> {
    try {
      const messagesKey = `${this.ROOM_MESSAGES_KEY}${roomId}`;

      // Get messages from Redis
      const messages = await this.redis.lrange(messagesKey, 0, limit - 1);

      // Parse and filter messages
      const parsedMessages: Array<IChatMessage> = messages
        .map(message => JSON.parse(message) as IChatMessage)
        .filter(message => !message.deleted) // Filter out deleted messages
        .filter(message => !before || new Date(message.timestamp) < before) // Filter by timestamp if specified
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); // Sort by timestamp

      return parsedMessages;
    } catch (error) {
      this.logger.error('Error getting room messages', { roomId, error });
      throw new GameError(
        'Failed to get room messages',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500
      );
    }
  }

  public async getUserRooms(userId: string): Promise<Array<IChatRoom>> {
    try {
      const userRoomsKey = `${this.USER_ROOMS_KEY}${userId}`;
      const roomIds = await this.redis.smembers(userRoomsKey);

      const rooms: Array<IChatRoom> = [];

      for (const roomId of roomIds) {
        const room = await this.getRoom(roomId);
        if (room) {
          rooms.push(room);
        }
      }

      // Sort by last activity
      rooms.sort((a, b) =>
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );

      return rooms;
    } catch (error) {
      this.logger.error('Error getting user rooms', { userId, error });
      throw new GameError(
        'Failed to get user rooms',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500
      );
    }
  }

  public async deleteMessage(roomId: string, messageId: string, userId: string): Promise<void> {
    try {
      // Get message
      const message = await this.getMessage(roomId, messageId);
      if (!message) {
        throw new GameError(
          'Message not found',
          ErrorCode.RESOURCE_NOT_FOUND,
          404
        );
      }

      // Check permissions
      if (message.userId !== userId) {
        throw new GameError(
          'Cannot delete another user\'s message',
          ErrorCode.FORBIDDEN,
          403
        );
      }

      // Mark as deleted
      message.deleted = true;
      message.content = '[Message deleted]';
      if (!message.metadata) message.metadata = {};
      message.metadata['deletedAt'] = new Date();
      message.metadata['deletedBy'] = userId;

      // Update message
      await this.updateMessage(message);

      // Notify room
      await this.broadcastRoomEvent(roomId, {
        type: 'message_deleted',
        data: { messageId, roomId, userId, timestamp: new Date() }
      });

      this.logger.info('Chat message deleted', { roomId, messageId, userId });
    } catch (error) {
      if (error instanceof GameError) {
        throw error;
      }
      this.logger.error('Error deleting chat message', { roomId, messageId, userId, error });
      throw new GameError(
        'Failed to delete chat message',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500
      );
    }
  }

  public async moderateMessage(roomId: string, messageId: string, moderatorId: string, action: 'delete' | 'warn' | 'ban'): Promise<void> {
    try {
      const message = await this.getMessage(roomId, messageId);
      if (!message) {
        throw new GameError(
          'Message not found',
          ErrorCode.RESOURCE_NOT_FOUND,
          404
        );
      }

      // Log moderation action
      const moderationKey = `${this.MESSAGE_MODERATION_KEY}${messageId}`;
      await this.redis.setex(moderationKey, 86_400, JSON.stringify({
        messageId,
        roomId,
        moderatorId,
        action,
        timestamp: new Date(),
        originalContent: message.content
      }));

      switch (action) {
        case 'delete': {
          message.deleted = true;
          message.content = '[Message removed by moderator]';
          if (!message.metadata) message.metadata = {};
          message.metadata['moderated'] = true;
          message.metadata['moderatedBy'] = moderatorId;
          message.metadata['moderatedAt'] = new Date();
          await this.updateMessage(message);
          break;
        }

        case 'warn': {
          // Send warning to user
          await this.sendModerationWarning(message.userId, moderatorId, 'Inappropriate message');
          break;
        }

        case 'ban': {
          // Ban user from room
          await this.banUserFromRoom(roomId, message.userId, moderatorId);
          break;
        }
      }

      this.logger.info('Message moderated', { roomId, messageId, moderatorId, action });
    } catch (error) {
      if (error instanceof GameError) {
        throw error;
      }
      this.logger.error('Error moderating message', { roomId, messageId, moderatorId, action, error });
      throw new GameError(
        'Failed to moderate message',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500
      );
    }
  }

  // Helper methods
  private generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private validateRoomData(room: IChatRoom): void {
    if (!room.name || room.name.length < 3 || room.name.length > 50) {
      throw new GameError(
        'Room name must be between 3 and 50 characters',
        ErrorCode.VALIDATION_ERROR,
        400
      );
    }

    if (room.maxMembers < 2 || room.maxMembers > 1000) {
      throw new GameError(
        'Room max members must be between 2 and 1000',
        ErrorCode.VALIDATION_ERROR,
        400
      );
    }
  }

  private validateMessage(content: string, messageType: MessageType): void {
    if (!content || content.trim().length === 0) {
      throw new GameError(
        'Message content cannot be empty',
        ErrorCode.VALIDATION_ERROR,
        400
      );
    }

    if (content.length > this.MAX_MESSAGE_LENGTH) {
      throw new GameError(
        `Message cannot exceed ${this.MAX_MESSAGE_LENGTH} characters`,
        ErrorCode.VALIDATION_ERROR,
        400
      );
    }

    // Add more validation based on message type
    switch (messageType) {
      case MessageType.TEXT: {
        // Basic text validation
        break;
      }
      case MessageType.EMOTE: {
        // Validate emote format
        break;
      }
      default: {
        // Default validation for other types
        break;
      }
    }
  }

  private sanitizeContent(content: string): string {
    // Basic content sanitization
    return content.trim();
  }

  private async checkRateLimit(userId: string): Promise<void> {
    const rateLimitKey = `chat:ratelimit:${userId}`;
    const current = await this.redis.incr(rateLimitKey);

    if (current === 1) {
      await this.redis.expire(rateLimitKey, 60); // 1 minute window
    }

    if (current > this.RATE_LIMIT_MESSAGES_PER_MINUTE) {
      throw new GameError(
        'Rate limit exceeded. Please slow down.',
        ErrorCode.RATE_LIMIT_EXCEEDED,
        429
      );
    }
  }

  private async checkMessageContent(message: IChatMessage): Promise<{ action: 'allow' | 'block' | 'flag' }> {
    // Simple moderation logic - in production, integrate with ML moderation service
    const blockedWords = ['spam', 'scam', 'hack', 'cheat'];
    const contentLower = message.content.toLowerCase();

    for (const word of blockedWords) {
      if (contentLower.includes(word)) {
        return { action: 'block' };
      }
    }

    return { action: 'allow' };
  }

  private async getRoom(roomId: string): Promise<IChatRoom | null> {
    const roomData = await this.redis.get(`${this.ROOM_KEY}${roomId}`);
    return roomData ? JSON.parse(roomData) : null;
  }

  private async updateRoom(room: IChatRoom): Promise<void> {
    await this.redis.setex(`${this.ROOM_KEY}${room.id}`, 86_400, JSON.stringify(room));
  }

  private async updateRoomActivity(roomId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (room) {
      room.lastActivity = new Date();
      await this.updateRoom(room);
    }
  }

  private async isRoomMember(roomId: string, userId: string): Promise<boolean> {
    const membersKey = `${this.ROOM_MEMBERS_KEY}${roomId}`;
    return await this.redis.sismember(membersKey, userId) === 1;
  }

  private async addRoomMember(roomId: string, userId: string): Promise<void> {
    const membersKey = `${this.ROOM_MEMBERS_KEY}${roomId}`;
    await this.redis.sadd(membersKey, userId);
    await this.redis.expire(membersKey, 86_400); // 24 hour TTL
  }

  private async removeRoomMember(roomId: string, userId: string): Promise<void> {
    const membersKey = `${this.ROOM_MEMBERS_KEY}${roomId}`;
    await this.redis.srem(membersKey, userId);
  }

  private async addUserRoom(userId: string, roomId: string): Promise<void> {
    const userRoomsKey = `${this.USER_ROOMS_KEY}${userId}`;
    await this.redis.sadd(userRoomsKey, roomId);
    await this.redis.expire(userRoomsKey, 86_400); // 24 hour TTL
  }

  private async removeUserRoom(userId: string, roomId: string): Promise<void> {
    const userRoomsKey = `${this.USER_ROOMS_KEY}${userId}`;
    await this.redis.srem(userRoomsKey, roomId);
  }

  private async saveMessage(message: IChatMessage): Promise<void> {
    const messagesKey = `${this.ROOM_MESSAGES_KEY}${message.roomId}`;

    // Add to list
    await this.redis.lpush(messagesKey, JSON.stringify(message));

    // Trim to max messages
    await this.redis.ltrim(messagesKey, 0, this.MAX_MESSAGES_PER_ROOM - 1);

    // Set TTL
    await this.redis.expire(messagesKey, 86_400); // 24 hour TTL
  }

  private async getMessage(roomId: string, messageId: string): Promise<IChatMessage | null> {
    const messagesKey = `${this.ROOM_MESSAGES_KEY}${roomId}`;
    const messages = await this.redis.lrange(messagesKey, 0, -1);

    for (const message_ of messages) {
      const message = JSON.parse(message_) as IChatMessage;
      if (message.id === messageId) {
        return message;
      }
    }

    return null;
  }

  private async updateMessage(message: IChatMessage): Promise<void> {
    const messagesKey = `${this.ROOM_MESSAGES_KEY}${message.roomId}`;
    const messages = await this.redis.lrange(messagesKey, 0, -1);

    // Find and update the message
    for (const [index, rawMessage] of messages.entries()) {
      if (!rawMessage) continue;
      const message_ = JSON.parse(rawMessage) as IChatMessage;
      if (message_.id === message.id) {
        await this.redis.lset(messagesKey, index, JSON.stringify(message));
        break;
      }
    }
  }

  private async broadcastMessage(roomId: string, message: IChatMessage): Promise<void> {
    const event = {
      type: 'chat_message',
      data: {
        roomId,
        message,
        timestamp: new Date()
      }
    };

    await this.broadcastRoomEvent(roomId, event);
  }

  private async broadcastRoomEvent(roomId: string, event: IChatEvent): Promise<void> {
    // Get room members
    const membersKey = `${this.ROOM_MEMBERS_KEY}${roomId}`;
    const members = await this.redis.smembers(membersKey);

    // Send to all members
    for (const userId of members) {
      await this.websocketManager.sendToUser(userId, event.type, event.data);
    }
  }

  private async sendModerationWarning(userId: string, moderatorId: string, reason: string): Promise<void> {
    const warning = {
      type: 'moderation_warning',
      data: {
        reason,
        moderatorId,
        timestamp: new Date(),
        severity: 'low'
      }
    };

    await this.websocketManager.sendToUser(userId, warning.type, warning.data);
  }

  private async banUserFromRoom(roomId: string, userId: string, moderatorId: string): Promise<void> {
    // Remove user from room
    await this.removeRoomMember(roomId, userId);
    await this.removeUserRoom(userId, roomId);

    // Add to ban list
    const banKey = `chat:room:banned:${roomId}`;
    await this.redis.sadd(banKey, userId);
    await this.redis.expire(banKey, 86_400); // 24 hour ban

    // Send ban notification
    await this.websocketManager.sendToUser(userId, 'room_banned', {
      roomId,
      moderatorId,
      timestamp: new Date()
    });
  }
}