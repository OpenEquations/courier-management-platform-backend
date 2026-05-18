import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripOrmEntity } from './entities/trip.orm-entity';
import { OutboxEventOrmEntity } from './entities/outbox-event.orm-entity';
import { ProcessedEventOrmEntity } from './entities/processed-event.orm-entity';
import { TypeOrmTripRepository } from './repositories/trip.repository';

@Module({
  imports: [TypeOrmModule.forFeature([TripOrmEntity, OutboxEventOrmEntity, ProcessedEventOrmEntity])],
  providers: [
    { provide: 'ITripRepository', useClass: TypeOrmTripRepository },
  ],
  exports: ['ITripRepository', TypeOrmModule],
})
export class TypeOrmPersistenceModule {}
