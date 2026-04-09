// application/user/ports/out/auth-service.port.ts

export interface IAuthService {
  generateToken(userId: string): Promise<string>;
  verifyToken(token: string): Promise<AuthPayload>;
  refreshToken(token: string): Promise<string>;
}

export interface AuthPayload {
  userId: string;
  email: string;
}