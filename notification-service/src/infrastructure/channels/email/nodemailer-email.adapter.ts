import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { IEmailSenderPort, SendEmailOptions } from '../../../domain/notification/interfaces/email-sender.port';

const FROM_ADDRESS = process.env.SMTP_FROM ?? 'noreply@courier.local';

@Injectable()
export class NodemailerEmailAdapter implements IEmailSenderPort {
  private readonly logger = new Logger(NodemailerEmailAdapter.name);
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    const smtpHost = process.env.SMTP_HOST;

    if (smtpHost) {
      // Production: real SMTP server
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT ?? '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Development: JSON transport — prints the full message to the logger
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
      this.logger.warn('SMTP_HOST not set — using console (jsonTransport) for emails');
    }
  }

  async send(options: SendEmailOptions): Promise<void> {
    const info = await this.transporter.sendMail({
      from: FROM_ADDRESS,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    // jsonTransport returns the full message as JSON in info.message
    if ((info as any).message) {
      this.logger.log(`[EMAIL DEV] ${JSON.stringify(JSON.parse((info as any).message), null, 2)}`);
    } else {
      this.logger.log(`[EMAIL] Sent to ${options.to} — messageId: ${info.messageId}`);
    }
  }
}
