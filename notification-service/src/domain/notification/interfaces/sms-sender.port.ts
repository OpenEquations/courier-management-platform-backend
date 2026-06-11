export interface SendSmsOptions {
  to: string;
  body: string;
}

export const SMS_SENDER_PORT = 'ISmssSenderPort';

export interface ISmsSenderPort {
  send(options: SendSmsOptions): Promise<void>;
}
