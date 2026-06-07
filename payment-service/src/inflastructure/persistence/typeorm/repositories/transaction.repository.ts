// infrastructure/persistence/typeorm/repositories/transaction.repository.ts

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ITransactionRepository } from "src/domain/payment/interfaces/repositories/transaction.repository.interface";
import { Transaction } from "src/domain/payment/entities/transaction.entity";
import { PaginatedResult } from "src/domain/shared/interfaces/paginated-result.interface";
import { TransactionOrmEntity } from "../entities/transaction.orm-entity";
import { TransactionMapper } from "../mappers/transaction.mapper";

@Injectable()
export class TypeOrmTransactionRepository implements ITransactionRepository {
  constructor(
    @InjectRepository(TransactionOrmEntity)
    private readonly repo: Repository<TransactionOrmEntity>,
  ) {}

  async save(transaction: Transaction): Promise<void> {
    await this.repo.save(TransactionMapper.toOrm(transaction));
  }

  async findById(id: string): Promise<Transaction | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? TransactionMapper.toDomain(orm) : null;
  }

  async findByAccountId(accountId: string, page: number, limit: number): Promise<PaginatedResult<Transaction>> {
    const [entities, total] = await this.repo.findAndCount({
      where: { accountId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: "DESC" },
    });

    return {
      data: entities.map(TransactionMapper.toDomain),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(transaction: Transaction): Promise<void> {
    await this.repo.save(TransactionMapper.toOrm(transaction));
  }
}
