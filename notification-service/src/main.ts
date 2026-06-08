import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Notification Service')
    .setDescription(
      `Delivers push/SMS/email notifications to riders and passengers.

## Status — stub / placeholder

This service is currently a **scaffold only** — the notification delivery logic
has not yet been implemented. It is called by trip-service on key lifecycle events
(trip accepted, driver arrived, trip completed, etc.) but presently only logs
the intent and returns success.

## Notes for consumers

You do **not** call this service directly from client apps. Notifications are
triggered automatically by trip-service and delivery-service over internal HTTP.

The \`GET /\` health endpoint below is only for container orchestration liveness probes.`,
    )
    .setVersion('1.0')
    .addTag('health', 'Liveness probe only — this service is a stub')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(process.env.PORT ?? 3005);
}
bootstrap();
