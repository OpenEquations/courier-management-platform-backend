import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ITripRepository } from 'src/domain/trip/interfaces/repositories/trip.repository.interface';
import { Trip } from 'src/domain/trip/entities/trip.entity';
import { TripStatus } from 'src/domain/trip/enums/trip-status.enum';
import { PaymentStatus } from 'src/domain/trip/enums/payment-status.enum';
import { PaginatedResult } from 'src/domain/shared/interfaces/paginated-result.interface';
import { TripOrmEntity } from '../entities/trip.orm-entity';
import { TripMapper } from '../mappers/trip.mapper';

@Injectable()
export class TypeOrmTripRepository implements ITripRepository {
  constructor(
    @InjectRepository(TripOrmEntity)
    private readonly repo: Repository<TripOrmEntity>,
  ) {}

  async save(trip: Trip): Promise<void> {
    await this.repo.save(TripMapper.toOrm(trip));
  }

  async findById(id: string): Promise<Trip | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? TripMapper.toDomain(orm) : null;
  }

  async findByPassengerId(passengerId: string, page: number, limit: number): Promise<PaginatedResult<Trip>> {
    const [entities, total] = await this.repo.findAndCount({
      where: { passengerId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return {
      data: entities.map(TripMapper.toDomain),
      total, page, limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByRiderId(riderId: string, page: number, limit: number): Promise<PaginatedResult<Trip>> {
    const [entities, total] = await this.repo.findAndCount({
      where: { riderId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return {
      data: entities.map(TripMapper.toDomain),
      total, page, limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByStatus(status: TripStatus, page: number, limit: number): Promise<PaginatedResult<Trip>> {
    const [entities, total] = await this.repo.findAndCount({
      where: { tripStatus: status },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return {
      data: entities.map(TripMapper.toDomain),
      total, page, limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAll(page: number, limit: number): Promise<PaginatedResult<Trip>> {
    const [entities, total] = await this.repo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return {
      data: entities.map(TripMapper.toDomain),
      total, page, limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findActiveByPassengerId(passengerId: string): Promise<Trip | null> {
    const orm = await this.repo.findOne({
      where: [
        { passengerId, tripStatus: In([TripStatus.PENDING, TripStatus.ONGOING]) },
        { passengerId, tripStatus: TripStatus.COMPLETED, paymentStatus: PaymentStatus.HELD },
      ],
      order: { updatedAt: 'DESC' },
    });
    return orm ? TripMapper.toDomain(orm) : null;
  }

  async update(trip: Trip): Promise<void> {
    await this.repo.save(TripMapper.toOrm(trip));
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
