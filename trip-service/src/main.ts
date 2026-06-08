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
    .setTitle('Trip Service')
    .setDescription(
      `Owns the lifecycle of a trip — from creation through broadcast, matching, in-progress
tracking and completion/cancellation/dispute. The central orchestrator of the ride/courier flow.

## Getting started

1. **Authenticate** against \`user-service\` (\`POST /users/login\`) to get a JWT — trip creation
   and "my active trip" require it (click **Authorize** above and paste \`Bearer <token>\`).
2. **Price it first**: call \`pricing-service\` \`POST /predict\` to get a \`predictedPrice\`,
   then **create the trip**: \`POST /trips\` with origin/destination/vehicle type/predicted price.
3. The trip starts in \`PENDING\` with an \`OPEN\` broadcast — \`matching-service\` finds nearby
   riders and pushes offers over WebSocket (see "Real-time updates" below).
4. A rider accepts → \`PATCH /trips/:id/lock-broadcast\` assigns them and agrees the price.
5. Drive the trip through its lifecycle: \`start\` → \`complete\` (or \`cancel\`/\`dispute\`/\`handoff\`
   for exceptional paths).

## Real-time updates (Socket.IO)

Connect to the \`/trips\` namespace (\`ws://localhost:3002/trips\`) to receive live updates:
- emit \`join-trip\` with a trip ID to receive \`trip-updated\` / \`rider-matched\` events for it
- riders emit \`register-rider\` with \`{ riderId }\` to receive \`new-trip-offer\` pushes

## Notes for consumers

- \`predictedPrice\` must come from pricing-service — the trip stores it and later compares it
  against the \`agreedPrice\` set when a rider locks the broadcast.
- Trip IDs and statuses (\`tripStatus\`, \`broadcastStatus\`, \`payment.status\`) drive UI state —
  poll \`GET /trips/:id\` or subscribe to the WebSocket for changes instead of guessing.
- This service talks to pricing-service, geo-service, notification-service, payment-service and
  matching-service internally — you normally only need to call trip-service and user-service directly.`,
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'JWT obtained from user-service POST /users/login' },
      'access-token',
    )
    .addTag('trips', 'Trip lifecycle: create, broadcast, match, drive, complete/cancel/dispute')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
