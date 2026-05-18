export interface INotificationPort {
  notifySender(senderId: string, message: string): Promise<void>;
  notifyRecipient(phone: string, message: string): Promise<void>;
}
