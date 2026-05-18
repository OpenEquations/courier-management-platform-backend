import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from 'src/domain/delivery/entities/delivery.entity';
import { IDeliveryRepository } from 'src/domain/delivery/interfaces/repositories/delivery.repository.interface';
import { DeliveryOrmEntity } from '../entities/delivery.orm-entity';
import { DeliveryMapper } from '../mappers/delivery.mapper';

export class TypeOrmDeliveryRepository implements IDeliveryRepository {
  constructor(
    @InjectRepository(DeliveryOrmEntity)
    private readonly repo: Repository<DeliveryOrmEntity>,
  ) {}

  async save(delivery: Delivery): Promise<void> {
    await this.repo.save(DeliveryMapper.toOrm(delivery));
  }

  async findById(id: string): Promise<Delivery | null> {
    const orm = await this.repo.findOneBy({ id });
    return orm ? DeliveryMapper.toDomain(orm) : null;
  }

  async findByTrackingNumber(trackingNumber: string): Promise<Delivery | null> {
    const orm = await this.repo.findOneBy({ trackingNumber });
    return orm ? DeliveryMapper.toDomain(orm) : null;
  }

  async findBySenderId(senderId: string): Promise<Delivery[]> {
    const orms = await this.repo
      .createQueryBuilder('d')
      .where("d.sender->>'id' = :senderId", { senderId })
      .getMany();
    return orms.map(DeliveryMapper.toDomain);
  }

  async findByCourierId(courierId: string): Promise<Delivery[]> {
    const orms = await this.repo.findBy({ currentTripId: courierId });
    return orms.map(DeliveryMapper.toDomain);
  }
}
