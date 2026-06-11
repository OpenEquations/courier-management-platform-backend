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

interface TripLocationState {
  passenger?: { lat: number; lng: number };
  rider?: { lat: number; lng: number };
  alerted?: boolean;
}

const PROXIMITY_THRESHOLD_KM = 1.0;

@WebSocketGateway({ namespace: '/trips', cors: { origin: '*' } })
export class TripBroadcastGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(TripBroadcastGateway.name);
  // track socket → riderId so we can clean up rooms on disconnect
  private readonly socketRider = new Map<string, string>();
  // track live passenger/rider positions per trip for proximity detection
  private readonly tripLocations = new Map<string, TripLocationState>();

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
    this.tripLocations.delete(tripId);
  }

  @SubscribeMessage('update-location')
  handleUpdateLocation(
    @MessageBody() data: { tripId: string; role: 'PASSENGER' | 'RIDER'; lat: number; lng: number },
  ) {
    const { tripId, role, lat, lng } = data;
    const state = this.tripLocations.get(tripId) ?? {};

    if (role === 'PASSENGER') {
      state.passenger = { lat, lng };
    } else {
      state.rider = { lat, lng };
    }
    this.tripLocations.set(tripId, state);

    this.server.to(`trip:${tripId}`).emit('location-update', { role, lat, lng });

    if (state.passenger && state.rider && !state.alerted) {
      const distanceKm = this.haversineKm(state.passenger, state.rider);
      if (distanceKm <= PROXIMITY_THRESHOLD_KM) {
        state.alerted = true;
        this.server.to(`trip:${tripId}`).emit('proximity-alert', { tripId, distanceKm });
        this.logger.log(`Proximity alert for trip ${tripId}: ${distanceKm.toFixed(3)}km`);
      }
    }
  }

  private haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
    const R = 6371;
    const dLat = this.toRad(b.lat - a.lat);
    const dLng = this.toRad(b.lng - a.lng);
    const lat1 = this.toRad(a.lat);
    const lat2 = this.toRad(b.lat);

    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
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
