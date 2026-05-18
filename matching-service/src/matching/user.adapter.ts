import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface RiderInfo {
  id: string;
  isAvailable: boolean;
  vehicles: { type: string; licensePlate: string }[];
}

@Injectable()
export class UserAdapter {
  private readonly logger = new Logger(UserAdapter.name);
  private readonly userUrl = process.env.USER_SERVICE_URL ?? 'http://localhost:3001';

  async getRidersByIds(ids: string[]): Promise<RiderInfo[]> {
    if (!ids.length) return [];
    try {
      const { data } = await axios.get<RiderInfo[]>(`${this.userUrl}/riders/batch`, {
        params: { ids: ids.join(',') },
        timeout: 5000,
      });
      return data ?? [];
    } catch (err) {
      this.logger.error(`user-service batch call failed: ${(err as Error).message}`);
      return [];
    }
  }
}
