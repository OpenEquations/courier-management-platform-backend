// application/user/user.module.ts

import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "src/presentation/controllers/user.controller";
import { TypeOrmPersistenceModule } from "src/inflastructure/persistence/typeorm/typeorm.module";
import { SecurityModule } from "src/inflastructure/security/security.module";


@Module({
  imports: [TypeOrmPersistenceModule, SecurityModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}