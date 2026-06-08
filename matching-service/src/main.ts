import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('Matching Service')
    .setDescription(
      `Connects available riders to newly-created trips.

## How it works (event-driven, no public REST API)

This service has **no externally-callable REST endpoints**.
It operates entirely through Kafka messages:

- **Consumes** \`trip.created\` events published by trip-service.
- On each event it queries geo-service (\`GET /locations/nearby\`) to find
  riders within range of the pickup point.
- It then calls trip-service to broadcast the trip offer to each candidate rider in turn
  until one accepts.

## Notes for consumers

You do **not** call this service directly. Create a trip via trip-service and
matching starts automatically. Monitor progress via the Socket.IO \`/trips\` namespace
on trip-service (events: \`rider-matched\`, \`new-trip-offer\`).

The \`GET /\` health endpoint below is only for container orchestration liveness probes.`,
    )
    .setVersion('1.0')
    .addTag('health', 'Liveness probe only — this service exposes no public REST API')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(process.env.PORT ?? 3007);
}
bootstrap();
