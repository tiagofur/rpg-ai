export interface IWebSocketManager {
  broadcast(event: string, data: any, room?: string): void;
  sendToUser(userId: string, event: string, data: any): void;
  sendToSession(sessionId: string, event: string, data: any): void;
  joinRoom(socketId: string, room: string): void;
  leaveRoom(socketId: string, room: string): void;
  getConnectedUsers(): Array<string>;
  isUserConnected(userId: string): boolean;
  disconnectUser(userId: string): void;
}