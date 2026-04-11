// domain/rider/repositories/rider.repository.interface.ts

import { Rider } from '../../entities/rider.entity';
import { PaginatedResult } from '../../../shared/interfaces/paginated-result.interface';

export interface IRiderRepository {
  save(rider: Rider): Promise<void>;
  findById(id: string): Promise<Rider | null>;
  findByUserId(userId: string): Promise<Rider | null>;
  findByVehiclePlate(plate: string): Promise<Rider | null>;
  findAll(page: number, limit: number): Promise<PaginatedResult<Rider>>;
  update(rider: Rider): Promise<void>;
  delete(id: string): Promise<void>;
  existsByUserId(userId: string): Promise<boolean>;
}
