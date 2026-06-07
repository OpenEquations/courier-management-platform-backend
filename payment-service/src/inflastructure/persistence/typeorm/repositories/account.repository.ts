// infrastructure/persistence/typeorm/repositories/account.repository.ts

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IAccountRepository } from "src/domain/payment/interfaces/repositories/account.repository.interface";
import { Account } from "src/domain/payment/entities/account.entity";
import { AccountOrmEntity } from "../entities/account.orm-entity";
import { AccountMapper } from "../mappers/account.mapper";

@Injectable()
export class TypeOrmAccountRepository implements IAccountRepository {
  constructor(
    @InjectRepository(AccountOrmEntity)
    private readonly repo: Repository<AccountOrmEntity>,
  ) {}

  async save(account: Account): Promise<void> {
    await this.repo.save(AccountMapper.toOrm(account));
  }

  async findById(id: string): Promise<Account | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? AccountMapper.toDomain(orm) : null;
  }

  async findByOwnerId(ownerId: string): Promise<Account | null> {
    const orm = await this.repo.findOne({ where: { ownerId } });
    return orm ? AccountMapper.toDomain(orm) : null;
  }

  async update(account: Account): Promise<void> {
    await this.repo.save(AccountMapper.toOrm(account));
  }
}
