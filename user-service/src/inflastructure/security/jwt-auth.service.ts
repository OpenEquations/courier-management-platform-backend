// infrastructure/security/jwt-auth.service.ts

import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { IAuthService, AuthPayload } from "src/application/user/ports/out/auth-service.port";

@Injectable()
export class JwtAuthService implements IAuthService {
  constructor(private readonly jwtService: JwtService) {}

  async generateToken(userId: string,): Promise<string> {
    const payload = { sub: userId};
    return this.jwtService.signAsync(payload);
  }

  async verifyToken(token: string): Promise<AuthPayload> {
    const payload = await this.jwtService.verifyAsync(token);
    return {
      userId: payload.sub,
      email: payload.email
    };
  }

  async refreshToken(token: string): Promise<string> {
    const payload = await this.verifyToken(token);
    return this.generateToken(payload.userId);
  }
}