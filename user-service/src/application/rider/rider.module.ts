// application/rider/rider.module.ts

import { Module } from "@nestjs/common";
import { RiderService } from "./rider.service";
import { RiderController } from "src/presentation/controllers/rider.controller";
import { TypeOrmPersistenceModule } from "src/inflastructure/persistence/typeorm/typeorm.module";
import { SecurityModule } from "src/inflastructure/security/security.module";

@Module({
  imports: [TypeOrmPersistenceModule, SecurityModule],
  controllers: [RiderController],
  providers: [RiderService],
  exports: [RiderService],
})
export class RiderModule {}
