import { Module } from '@nestjs/common';
import { EMAIL_SENDER_PORT } from '../../domain/notification/interfaces/email-sender.port';
import { SMS_SENDER_PORT } from '../../domain/notification/interfaces/sms-sender.port';
import { NodemailerEmailAdapter } from './email/nodemailer-email.adapter';
import { MockSmsAdapter } from './sms/mock-sms.adapter';

@Module({
  providers: [
    { provide: EMAIL_SENDER_PORT, useClass: NodemailerEmailAdapter },
    { provide: SMS_SENDER_PORT, useClass: MockSmsAdapter },
  ],
  exports: [EMAIL_SENDER_PORT, SMS_SENDER_PORT],
})
export class ChannelsModule {}
