import { PaginatedResult } from '../../../shared/interfaces/paginated-result.interface';
import { Trip } from '../../entities/trip.entity';
import { TripStatus } from '../../enums/trip-status.enum';

export interface ITripRepository {
  save(trip: Trip): Promise<void>;
  findById(id: string): Promise<Trip | null>;
  findByPassengerId(passengerId: string, page: number, limit: number): Promise<PaginatedResult<Trip>>;
  findByRiderId(riderId: string, page: number, limit: number): Promise<PaginatedResult<Trip>>;
  findByStatus(status: TripStatus, page: number, limit: number): Promise<PaginatedResult<Trip>>;
  findAll(page: number, limit: number): Promise<PaginatedResult<Trip>>;
  findActiveByPassengerId(passengerId: string): Promise<Trip | null>;
  update(trip: Trip): Promise<void>;
  delete(id: string): Promise<void>;
}
