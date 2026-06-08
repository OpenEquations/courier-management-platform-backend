import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Routing Service')
    .setDescription(
      `Computes optimal driving routes and ETAs between two geographic points.

## Status — stub / placeholder

This service is currently a **scaffold only** — route computation has not yet
been implemented. It will integrate with a mapping provider (e.g. Google Maps
Directions API, OSRM, or Valhalla) to return turn-by-turn routes, distances,
and estimated travel times.

## Intended API (coming soon)

\`POST /routes\` — accepts \`origin\` and \`destination\` coordinates plus optional
\`waypoints\`, returns encoded polyline, distance in metres, and duration in seconds.

## Notes for consumers

- trip-service will call this service to pre-compute the expected route at the
  start of each trip, which feeds into the pricing estimate and ETA display.
- The \`GET /\` health endpoint below is only for container orchestration liveness probes.`,
    )
    .setVersion('1.0')
    .addTag('health', 'Liveness probe only — this service is a stub')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(process.env.PORT ?? 3009);
}
bootstrap();
