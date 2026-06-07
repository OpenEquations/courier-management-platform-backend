// infrastructure/persistence/typeorm/mappers/account.mapper.ts

import { Account } from "src/domain/payment/entities/account.entity";
import { AccountOrmEntity } from "../entities/account.orm-entity";

export class AccountMapper {
  static toDomain(orm: AccountOrmEntity): Account {
    return Account.reconstitute({
      id: orm.id,
      ownerId: orm.ownerId,
      ownerName: orm.ownerName,
      balance: Number(orm.balance),
      heldBalance: Number(orm.heldBalance),
      currency: orm.currency,
      status: orm.status,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: Account): AccountOrmEntity {
    const orm = new AccountOrmEntity();
    orm.id = domain.getId();
    orm.ownerId = domain.getOwnerId();
    orm.ownerName = domain.getOwnerName();
    orm.balance = domain.getBalance().toFixed(2);
    orm.heldBalance = domain.getHeldBalance().toFixed(2);
    orm.currency = domain.getCurrency();
    orm.status = domain.getStatus();
    return orm;
  }
}
