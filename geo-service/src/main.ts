import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const config = new DocumentBuilder()
    .setTitle('Geo Service')
    .setDescription(
      `Tracks riders' live positions in Redis (geospatial index) and answers "who is nearby" queries.
The backbone of rider matching and live trip-tracking.

## Getting started

No authentication is required — this service is called internally by rider apps (to push GPS
updates) and by matching-service / trip-service (to find nearby riders). Treat it as infrastructure:

1. **Rider apps** call \`POST /locations\` every few seconds while online, with the rider's current
   lat/lng (and optional heading).
2. **Matching/trip services** call \`GET /nearby\` with an origin point to get the closest available
   riders, ordered by distance.
3. When a rider goes offline, call \`DELETE /locations/:riderId\` to stop surfacing them in searches.

## Notes for consumers

- Coordinates use standard WGS84 lat/lng (decimal degrees).
- \`GET /nearby\` returns riders ordered closest-first; combine with user-service's
  \`GET /riders/batch\` to enrich results with availability and vehicle info (this is exactly
  what matching-service does).
- Locations are stored in Redis with no persistence guarantees beyond the cache — this service is
  a live-position cache, not a historical-tracking store.`,
    )
    .setVersion('1.0')
    .addTag('locations', 'Push and query riders’ live geo-positions')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(process.env.PORT ?? 3004);
}
bootstrap();
