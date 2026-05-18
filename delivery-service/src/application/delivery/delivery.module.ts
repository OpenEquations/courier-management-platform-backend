import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from 'src/presentation/controllers/delivery.controller';
import { PublicTrackingController } from 'src/presentation/controllers/public-tracking.controller';
import { TypeOrmPersistenceModule } from 'src/inflastructure/persistence/typeorm/typeorm.module';
import { DeliveryEventPublisher } from 'src/inflastructure/messaging/publishers/delivery-event.publisher';
import { KafkaOutboxPoller } from 'src/inflastructure/messaging/kafka-outbox.poller';
import { NotificationAdapter } from 'src/inflastructure/external-services/notification.adapter';
import { OtpAdapter } from 'src/inflastructure/external-services/otp.adapter';
import { S3StorageAdapter } from 'src/inflastructure/external-services/s3-storage.adapter';
import { TrackingNumberGeneratorAdapter } from 'src/inflastructure/external-services/tracking-number-generator.adapter';
import { TripEventsConsumer } from 'src/inflastructure/messaging/consumers/trip-events.consumer';

@Module({
  imports: [TypeOrmPersistenceModule],
  controllers: [DeliveryController, PublicTrackingController],
  providers: [
    DeliveryService,
    KafkaOutboxPoller,
    TripEventsConsumer,
    { provide: 'IEventPublisherPort', useClass: DeliveryEventPublisher },
    { provide: 'INotificationPort', useClass: NotificationAdapter },
    { provide: 'IOtpPort', useClass: OtpAdapter },
    { provide: 'IStoragePort', useClass: S3StorageAdapter },
    { provide: 'ITrackingNumberGeneratorPort', useClass: TrackingNumberGeneratorAdapter },
  ],
  exports: [DeliveryService],
})
export class DeliveryModule {}
