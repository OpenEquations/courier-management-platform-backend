import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TripService } from './trip.service';
import { TripController } from 'src/presentation/controllers/trip.controller';
import { TypeOrmPersistenceModule } from 'src/inflastructure/persistence/typeorm/typeorm.module';
import { MessagingModule } from 'src/inflastructure/messaging/messaging.module';
import { PricePredictorAdapter } from 'src/inflastructure/http/price-predictor.adapter';
import { GeolocationAdapter } from 'src/inflastructure/external-services/geolocation.adapter';
import { NotificationAdapter } from 'src/inflastructure/external-services/notification.adapter';
import { PaymentGatewayAdapter } from 'src/inflastructure/external-services/payment-gateway.adapter';

@Module({
  imports: [TypeOrmPersistenceModule, MessagingModule, HttpModule],
  controllers: [TripController],
  providers: [
    TripService,
    { provide: 'IPricePredictorPort', useClass: PricePredictorAdapter },
    { provide: 'IGeolocationPort', useClass: GeolocationAdapter },
    { provide: 'INotificationPort', useClass: NotificationAdapter },
    { provide: 'IPaymentGatewayPort', useClass: PaymentGatewayAdapter },
  ],
  exports: [TripService],
})
export class TripModule {}
