// infrastructure/security/bcrypt-hash.service.ts

import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { IHashService } from "src/application/user/ports/out/hash-service.port";

@Injectable()
export class BcryptHashService implements IHashService {
  private readonly SALT_ROUNDS = 12;

  async hash(value: string): Promise<string> {
    return bcrypt.hash(value, this.SALT_ROUNDS);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}