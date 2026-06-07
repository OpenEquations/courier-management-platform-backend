// domain/payment/interfaces/repositories/account.repository.interface.ts

import { Account } from '../../entities/account.entity';

export interface IAccountRepository {
  save(account: Account): Promise<void>;
  findById(id: string): Promise<Account | null>;
  findByOwnerId(ownerId: string): Promise<Account | null>;
  update(account: Account): Promise<void>;
}
