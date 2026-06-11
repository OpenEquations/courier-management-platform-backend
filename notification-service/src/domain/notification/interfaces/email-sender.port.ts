export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const EMAIL_SENDER_PORT = 'IEmailSenderPort';

export interface IEmailSenderPort {
  send(options: SendEmailOptions): Promise<void>;
}
