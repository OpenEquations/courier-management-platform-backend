export interface IAuthService {
  generateToken(userId: string): string;
  verifyToken(token: string): { userId: string } | null;
}
