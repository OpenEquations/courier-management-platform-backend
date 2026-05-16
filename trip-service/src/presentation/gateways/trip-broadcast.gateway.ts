import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ namespace: '/trips', cors: { origin: '*' } })
export class TripBroadcastGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(TripBroadcastGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-trip')
  handleJoinTrip(@MessageBody() tripId: string, @ConnectedSocket() client: Socket) {
    client.join(`trip:${tripId}`);
    this.logger.log(`Client ${client.id} joined room trip:${tripId}`);
  }

  @SubscribeMessage('leave-trip')
  handleLeaveTrip(@MessageBody() tripId: string, @ConnectedSocket() client: Socket) {
    client.leave(`trip:${tripId}`);
  }

  broadcastTripUpdate(tripId: string, payload: unknown): void {
    this.server.to(`trip:${tripId}`).emit('trip-updated', payload);
  }

  broadcastRiderMatched(tripId: string, riderId: string): void {
    this.server.to(`trip:${tripId}`).emit('rider-matched', { tripId, riderId });
  }
}
