import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryOrmEntity } from './entities/delivery.orm-entity';
import { OutboxEventOrmEntity } from './entities/outbox-event.orm-entity';
import { ProcessedEventOrmEntity } from './entities/processed-event.orm-entity';
import { TypeOrmDeliveryRepository } from './repositories/delivery.typeorm.repository';

@Module({
  imports: [TypeOrmModule.forFeature([DeliveryOrmEntity, OutboxEventOrmEntity, ProcessedEventOrmEntity])],
  providers: [
    { provide: 'IDeliveryRepository', useClass: TypeOrmDeliveryRepository },
  ],
  exports: ['IDeliveryRepository', TypeOrmModule],
})
export class TypeOrmPersistenceModule {}
