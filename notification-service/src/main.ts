import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './infrastructure/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Notification Service')
    .setDescription(
      `Delivers email and SMS notifications to riders and passengers.

## How it works

This service operates in two modes:

### 1. Event-driven (Kafka)
Consumes events from three topics and dispatches notifications automatically:
- **\`trip.events\`** — trip lifecycle (created, started, completed, cancelled, assigned, etc.)
- **\`delivery.events\`** — delivery lifecycle (created, picked up, delivered, returned, etc.)
- **\`matching.events\`** — rider offer dispatch (notifies passengers that riders are being matched)

### 2. Direct HTTP
Other services can POST to \`/notifications/email\` or \`/notifications/sms\` to send
ad-hoc notifications without going through Kafka.

## Channels
- **Email** — Nodemailer (console/jsonTransport in dev; set \`SMTP_HOST\` for production)
- **SMS** — Mock adapter in dev (logs to console); swap in \`channels.module.ts\` for Twilio/Africa's Talking

## Environment variables
| Variable | Default | Description |
|---|---|---|
| \`KAFKA_BROKER\` | \`localhost:9092\` | Kafka bootstrap server |
| \`USER_SERVICE_URL\` | \`http://localhost:3001\` | Used to look up user/rider contact info |
| \`SMTP_HOST\` | *(unset = dev mode)* | SMTP server hostname |
| \`SMTP_PORT\` | \`587\` | SMTP port |
| \`SMTP_USER\` | — | SMTP auth username |
| \`SMTP_PASS\` | — | SMTP auth password |
| \`SMTP_FROM\` | \`noreply@courier.local\` | Sender address |
`,
    )
    .setVersion('1.0')
    .addTag('notifications', 'Direct notification endpoints for other services')
    .addTag('health', 'Liveness probe')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(process.env.PORT ?? 3005);
}
bootstrap();
