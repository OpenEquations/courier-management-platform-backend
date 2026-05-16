import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripOrmEntity } from './entities/trip.orm-entity';
import { TypeOrmTripRepository } from './repositories/trip.repository';

@Module({
  imports: [TypeOrmModule.forFeature([TripOrmEntity])],
  providers: [
    { provide: 'ITripRepository', useClass: TypeOrmTripRepository },
  ],
  exports: ['ITripRepository'],
})
export class TypeOrmPersistenceModule {}
