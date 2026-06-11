import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { ChannelsModule } from '../../infrastructure/channels/channels.module';
import { NotificationController } from '../../presentation/controllers/notification.controller';

@Module({
  imports: [ChannelsModule],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
