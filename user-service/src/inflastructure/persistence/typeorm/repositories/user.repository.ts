// infrastructure/persistence/typeorm/repositories/user.repository.ts

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IUserRepository } from "src/domain/user/interfaces/repositories/user.repository.interface";
import { User } from "src/domain/user/entities/user.entity";
import { Email } from "src/domain/user/value-objects/email.vo";
import { NationalId } from "src/domain/user/value-objects/national-id.vo";
import { PaginatedResult } from "src/domain/shared/interfaces/paginated-result.interface";
import { UserOrmEntity } from "../entities/user.orm-entity";
import { UserMapper } from "../mappers/user.mapper";

@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
  ) {}

  async save(user: User): Promise<void> {
    const orm = UserMapper.toOrm(user);
    await this.repo.save(orm);
  }

  async findById(id: string): Promise<User | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? UserMapper.toDomain(orm) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const orm = await this.repo.findOne({ where: { email: email.getValue() } });
    return orm ? UserMapper.toDomain(orm) : null;
  }

  async findByNationalId(nationalId: NationalId): Promise<User | null> {
    const orm = await this.repo.findOne({ where: { nationalId: nationalId.getValue() } });
    return orm ? UserMapper.toDomain(orm) : null;
  }

  async findAll(page: number, limit: number): Promise<PaginatedResult<User>> {
    const [entities, total] = await this.repo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: "DESC" },
    });

    return {
      data: entities.map(UserMapper.toDomain),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(user: User): Promise<void> {
    const orm = UserMapper.toOrm(user);
    await this.repo.save(orm);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const count = await this.repo.count({ where: { email: email.getValue() } });
    return count > 0;
  }
}