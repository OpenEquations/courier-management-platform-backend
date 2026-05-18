import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TripService } from './trip.service';
import { TripController } from 'src/presentation/controllers/trip.controller';
import { TypeOrmPersistenceModule } from 'src/inflastructure/persistence/typeorm/typeorm.module';
import { MessagingModule } from 'src/inflastructure/messaging/messaging.module';
import { DeliveryCreatedConsumer } from 'src/inflastructure/messaging/consumers/delivery-created.consumer';
import { PricePredictorAdapter } from 'src/inflastructure/http/price-predictor.adapter';
import { GeolocationAdapter } from 'src/inflastructure/external-services/geolocation.adapter';
import { NotificationAdapter } from 'src/inflastructure/external-services/notification.adapter';
import { PaymentGatewayAdapter } from 'src/inflastructure/external-services/payment-gateway.adapter';
import { SecurityModule } from 'src/inflastructure/security/security.module';

@Module({
  imports: [TypeOrmPersistenceModule, MessagingModule, HttpModule, SecurityModule],
  controllers: [TripController],
  providers: [
    TripService,
    DeliveryCreatedConsumer,
    { provide: 'IPricePredictorPort', useClass: PricePredictorAdapter },
    { provide: 'IGeolocationPort', useClass: GeolocationAdapter },
    { provide: 'INotificationPort', useClass: NotificationAdapter },
    { provide: 'IPaymentGatewayPort', useClass: PaymentGatewayAdapter },
  ],
  exports: [TripService],
})
export class TripModule {}
