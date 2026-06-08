import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Rating Service')
    .setDescription(
      `Collects and aggregates post-trip ratings for riders and passengers.

## Status — stub / placeholder

This service is currently a **scaffold only** — rating submission and aggregation
logic has not yet been implemented. It will accept star ratings and reviews
after each completed trip and expose aggregate scores per user.

## Notes for consumers

Rating prompts will eventually be surfaced in the client app after a trip reaches
\`COMPLETED\` status (polled or pushed via trip-service WebSocket). The submission
endpoint will be documented here once implemented.

The \`GET /\` health endpoint below is only for container orchestration liveness probes.`,
    )
    .setVersion('1.0')
    .addTag('health', 'Liveness probe only — this service is a stub')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(process.env.PORT ?? 3008);
}
bootstrap();
