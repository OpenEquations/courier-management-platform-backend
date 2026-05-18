// infrastructure/persistence/typeorm/repositories/rider.repository.ts

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { IRiderRepository } from "src/domain/rider/interfaces/repositories/rider.repository.interface";
import { Rider } from "src/domain/rider/entities/rider.entity";
import { PaginatedResult } from "src/domain/shared/interfaces/paginated-result.interface";
import { RiderOrmEntity } from "../entities/rider.orm-entity";
import { RiderMapper } from "../mappers/rider.mapper";

@Injectable()
export class TypeOrmRiderRepository implements IRiderRepository {
  constructor(
    @InjectRepository(RiderOrmEntity)
    private readonly repo: Repository<RiderOrmEntity>,
  ) {}

  async save(rider: Rider): Promise<void> {
    const orm = RiderMapper.toOrm(rider);
    await this.repo.save(orm);
  }

  async findById(id: string): Promise<Rider | null> {
    const orm = await this.repo.findOne({ where: { id }, relations: ["user"] });
    return orm ? RiderMapper.toDomain(orm) : null;
  }

  async findByIds(ids: string[]): Promise<Rider[]> {
    if (!ids.length) return [];
    const entities = await this.repo.find({ where: { id: In(ids) }, relations: ["user"] });
    return entities.map(RiderMapper.toDomain);
  }

  async findByUserId(userId: string): Promise<Rider | null> {
    const orm = await this.repo.findOne({ where: { userId }, relations: ["user"] });
    return orm ? RiderMapper.toDomain(orm) : null;
  }

  async findByVehiclePlate(plate: string): Promise<Rider | null> {
    const orm = await this.repo
      .createQueryBuilder("rider")
      .leftJoinAndSelect("rider.user", "user")
      .where(`rider.vehicles @> :vehicle::jsonb`, {
        vehicle: JSON.stringify([{ licensePlate: plate }]),
      })
      .getOne();
    return orm ? RiderMapper.toDomain(orm) : null;
  }

  async findAll(page: number, limit: number): Promise<PaginatedResult<Rider>> {
    const [entities, total] = await this.repo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ["user"],
      order: { createdAt: "DESC" },
    });

    return {
      data: entities.map(RiderMapper.toDomain),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(rider: Rider): Promise<void> {
    const orm = RiderMapper.toOrm(rider);
    await this.repo.save(orm);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async existsByUserId(userId: string): Promise<boolean> {
    const count = await this.repo.count({ where: { userId } });
    return count > 0;
  }
}
