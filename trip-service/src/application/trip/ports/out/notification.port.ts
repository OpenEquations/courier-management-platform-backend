export interface INotificationPort {
  notifyUser(userId: string, message: string, data?: Record<string, unknown>): Promise<void>;
  notifyRider(riderId: string, message: string, data?: Record<string, unknown>): Promise<void>;
}
