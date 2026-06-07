// application/payment/payment.module.ts

import { Module } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { AccountController } from "src/presentation/controllers/account.controller";
import { TransactionController } from "src/presentation/controllers/transaction.controller";
import { TypeOrmPersistenceModule } from "src/inflastructure/persistence/typeorm/typeorm.module";

@Module({
  imports: [TypeOrmPersistenceModule],
  controllers: [AccountController, TransactionController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
