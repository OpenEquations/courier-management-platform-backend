// infrastructure/persistence/typeorm/mappers/transaction.mapper.ts

import { Transaction } from "src/domain/payment/entities/transaction.entity";
import { TransactionOrmEntity } from "../entities/transaction.orm-entity";

export class TransactionMapper {
  static toDomain(orm: TransactionOrmEntity): Transaction {
    return Transaction.reconstitute({
      id: orm.id,
      accountId: orm.accountId,
      payerId: orm.payerId,
      amount: Number(orm.amount),
      currency: orm.currency,
      status: orm.status,
      reference: orm.reference,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: Transaction): TransactionOrmEntity {
    const orm = new TransactionOrmEntity();
    orm.id = domain.getId();
    orm.accountId = domain.getAccountId();
    orm.payerId = domain.getPayerId();
    orm.amount = domain.getAmount().toFixed(2);
    orm.currency = domain.getCurrency();
    orm.status = domain.getStatus();
    orm.reference = domain.getReference();
    return orm;
  }
}
