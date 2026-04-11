// infrastructure/persistence/typeorm/typeorm.module.ts

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserOrmEntity } from "./entities/user.orm-entity";
import { RiderOrmEntity } from "./entities/rider.orm-entity";
import { TypeOrmUserRepository } from "./repositories/user.repository";
import { TypeOrmRiderRepository } from "./repositories/rider.repository";

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity, RiderOrmEntity])],
  providers: [
    {
      provide: "IUserRepository",
      useClass: TypeOrmUserRepository,
    },
    {
      provide: "IRiderRepository",
      useClass: TypeOrmRiderRepository,
    },
  ],
  exports: ["IUserRepository", "IRiderRepository"],
})
export class TypeOrmPersistenceModule {}