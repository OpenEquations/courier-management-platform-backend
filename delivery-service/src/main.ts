import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './inflastructure/filters/domain-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new DomainExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  const config = new DocumentBuilder()
    .setTitle('Delivery Service')
    .setDescription(
      `Owns parcel deliveries end-to-end: intake, courier assignment, pickup/in-transit/delivery
proof, cash-on-delivery (COD) collection & remittance, and public package tracking.

## Getting started

Most endpoints here are called by **operations/dispatch tooling and courier apps** rather than
end-users directly — there is no JWT guard on this controller (it's intended to sit behind an
internal gateway). The one fully public endpoint is tracking:

1. **Create a delivery**: \`POST /deliveries\` with sender, recipient, pickup/dropoff locations
   and package details. You get back a \`trackingNumber\` immediately.
2. **Share tracking**: anyone (no auth) can call \`GET /track/:trackingNumber\` to see live status —
   this is the endpoint to surface to end customers (e.g. "Track your package" links).
3. **Drive the lifecycle** as the courier progresses: \`assign\` → \`pick-up\` → \`in-transit\` →
   \`out-for-delivery\` → \`complete\` (or \`fail\`/\`return\`/\`cancel\` for exceptions).
4. If \`codAmount\` was set at creation, use \`collect-cod\` then \`remit-cod\` once the courier
   hands the cash back to the platform.

## Notes for consumers

- \`trackingNumber\` is the customer-facing identifier; \`id\` is the internal UUID used by the
  lifecycle endpoints.
- This service emits \`delivery.*\` events (created/picked-up/delivered/...) over Kafka, and is
  itself driven by \`trip.*\` events from trip-service when a delivery is linked to a ride —
  most state transitions happen automatically once a courier is assigned to a trip.
- Proof of pickup/delivery accepts \`SIGNATURE\`, \`PHOTO\`, \`QR_CODE\` or \`OTP\` — pass a
  \`fileUrl\` for image/signature evidence (uploaded via your own storage) or rely on OTP/QR
  verification handled by this service.`,
    )
    .setVersion('1.0')
    .addTag('deliveries', 'Operational lifecycle: assignment, pickup, transit, delivery, COD')
    .addTag('tracking', 'Public, unauthenticated package tracking by tracking number')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(process.env.PORT ?? 3010);
}
bootstrap();
