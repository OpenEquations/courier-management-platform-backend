export interface IPaymentGatewayPort {
  hold(userId: string, amount: number, currency: string): Promise<string>;
  release(transactionId: string): Promise<void>;
  refund(transactionId: string): Promise<void>;
}
