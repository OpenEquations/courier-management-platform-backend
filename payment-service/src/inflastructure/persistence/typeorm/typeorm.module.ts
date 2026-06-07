// infrastructure/persistence/typeorm/typeorm.module.ts

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AccountOrmEntity } from "./entities/account.orm-entity";
import { TransactionOrmEntity } from "./entities/transaction.orm-entity";
import { TypeOrmAccountRepository } from "./repositories/account.repository";
import { TypeOrmTransactionRepository } from "./repositories/transaction.repository";

@Module({
  imports: [TypeOrmModule.forFeature([AccountOrmEntity, TransactionOrmEntity])],
  providers: [
    {
      provide: "IAccountRepository",
      useClass: TypeOrmAccountRepository,
    },
    {
      provide: "ITransactionRepository",
      useClass: TypeOrmTransactionRepository,
    },
  ],
  exports: ["IAccountRepository", "ITransactionRepository"],
})
export class TypeOrmPersistenceModule {}
