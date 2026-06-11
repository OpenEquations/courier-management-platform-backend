import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface UserContact {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface RiderContact {
  id: string;
  name: string;
  email: string;
  phone: string;
}

@Injectable()
export class UserServiceAdapter {
  private readonly logger = new Logger(UserServiceAdapter.name);
  private readonly baseUrl = process.env.USER_SERVICE_URL ?? 'http://localhost:3001';

  async getUserById(id: string): Promise<UserContact | null> {
    try {
      const { data } = await axios.get<UserContact>(`${this.baseUrl}/users/${id}`, {
        timeout: 3_000,
      });
      return data;
    } catch (err) {
      this.logger.warn(`Could not fetch user ${id}: ${(err as Error).message}`);
      return null;
    }
  }

  async getRiderById(id: string): Promise<RiderContact | null> {
    try {
      const { data } = await axios.get<RiderContact>(`${this.baseUrl}/riders/${id}`, {
        timeout: 3_000,
      });
      return data;
    } catch (err) {
      this.logger.warn(`Could not fetch rider ${id}: ${(err as Error).message}`);
      return null;
    }
  }
}
