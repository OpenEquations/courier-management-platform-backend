// domain/repositories/user.repository.interface.ts

import { PaginatedResult } from '../../../shared/interfaces/paginated-result.interface';
import { User } from '../../entities/user.entity';
import { Email } from '../../value-objects/email.vo';
import { NationalId } from '../../value-objects/national-id.vo';

export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findByNationalId(nationalId: NationalId): Promise<User | null>; // unique field, you'll need this
  findAll(page: number, limit: number): Promise<PaginatedResult<User>>; // listing users
  update(user: User): Promise<void>; // separate from save for clarity
  delete(id: string): Promise<void>;
  existsByEmail(email: Email): Promise<boolean>; // cheaper than fetching full entity
}
