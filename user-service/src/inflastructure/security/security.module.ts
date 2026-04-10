// infrastructure/security/security.module.ts

import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { BcryptHashService } from "./bcrypt-hash.service";
import { JwtAuthService } from "./jwt-auth.service";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "24h" },
    }),
  ],
  providers: [
    {
      provide: "IHashService",
      useClass: BcryptHashService,
    },
    {
      provide: "IAuthService",
      useClass: JwtAuthService,
    },
  ],
  exports: ["IHashService", "IAuthService"],
})
export class SecurityModule {}