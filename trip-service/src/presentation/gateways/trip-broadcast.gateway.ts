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
  // track socket → riderId so we can clean up rooms on disconnect
  private readonly socketRider = new Map<string, string>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const riderId = this.socketRider.get(client.id);
    if (riderId) {
      client.leave(`rider:${riderId}`);
      this.socketRider.delete(client.id);
    }
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

  // Rider app calls this after connecting to register for offer notifications
  @SubscribeMessage('register-rider')
  handleRegisterRider(
    @MessageBody() data: { riderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`rider:${data.riderId}`);
    this.socketRider.set(client.id, data.riderId);
    this.logger.log(`Rider ${data.riderId} registered on socket ${client.id}`);
  }

  broadcastTripUpdate(tripId: string, payload: unknown): void {
    this.server.to(`trip:${tripId}`).emit('trip-updated', payload);
  }

  broadcastRiderMatched(tripId: string, riderId: string): void {
    this.server.to(`trip:${tripId}`).emit('rider-matched', { tripId, riderId });
  }

  // Called by RiderOfferConsumer when matching.events arrives
  pushTripOfferToRiders(riderIds: string[], payload: unknown): void {
    for (const riderId of riderIds) {
      this.server.to(`rider:${riderId}`).emit('new-trip-offer', payload);
    }
    this.logger.log(`Pushed offer to ${riderIds.length} rider room(s)`);
  }
}
