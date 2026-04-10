// infrastructure/persistence/typeorm/typeorm.module.ts

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserOrmEntity } from "./entities/user.orm-entity";
import { TypeOrmUserRepository } from "./repositories/user.repository";

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity])],
  providers: [
    {
      provide: "IUserRepository",
      useClass: TypeOrmUserRepository,
    },
  ],
  exports: ["IUserRepository"],
})
export class TypeOrmPersistenceModule {}