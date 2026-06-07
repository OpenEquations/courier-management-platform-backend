// domain/payment/interfaces/repositories/transaction.repository.interface.ts

import { PaginatedResult } from '../../../shared/interfaces/paginated-result.interface';
import { Transaction } from '../../entities/transaction.entity';

export interface ITransactionRepository {
  save(transaction: Transaction): Promise<void>;
  findById(id: string): Promise<Transaction | null>;
  findByAccountId(accountId: string, page: number, limit: number): Promise<PaginatedResult<Transaction>>;
  update(transaction: Transaction): Promise<void>;
}
