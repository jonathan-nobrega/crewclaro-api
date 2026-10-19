import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({ path: "/realtime", cors: { origin: process.env.CORS_ORIGINS?.split(","), credentials: true } })
export class RealtimeGateway {
  @WebSocketServer() server!: Server;

  @SubscribeMessage("project.join")
  join(@MessageBody() body: { projectId: string }, @ConnectedSocket() socket: Socket) {
    socket.join(`project:${body.projectId}`);
  }

  emit(projectId: string, event: "message.created" | "message.translated" | "task.updated", payload: unknown) {
    this.server.to(`project:${projectId}`).emit(event, payload);
  }
}
