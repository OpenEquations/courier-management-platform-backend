import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DomainExceptionFilter } from './inflastructure/filters/domain-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new DomainExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Payment Service')
    .setDescription(
      `Manages in-platform wallets and payment holds for riders and passengers.
It is an **internal service** — all calls originate from trip-service or admin tooling,
not directly from end-user clients.

## Getting started

1. **Open an account** — \`POST /accounts\` creates a wallet tied to a user ID.
   Every rider and passenger must have an account before they can take or pay for a trip.
2. **Top up** — \`POST /accounts/:id/topup\` credits the account (simulates bank transfer / mobile money).
3. **Hold funds** — \`POST /transactions/hold\` earmarks the exact trip fare on the payer's account
   at the moment a trip is accepted.  This guarantees the money is available at completion.
4. **Release or refund** — On trip completion \`POST /transactions/:id/release\` settles the hold;
   on cancellation \`POST /transactions/:id/refund\` returns it to \`availableBalance\`.
5. **Inspect** — \`GET /accounts/:id\`, \`GET /accounts/by-owner/:ownerId\`, \`GET /accounts/:id/transactions\`,
   \`GET /transactions/:id\` for balance and history queries.

## Notes for consumers

- \`balance\` = total funds; \`heldBalance\` = currently earmarked; \`availableBalance\` = balance − held.
- Currency is a 3-letter ISO code (default \`RWF\`); all amounts are in the smallest displayable unit.
- This service does **not** integrate with real payment gateways — it is a simulation layer.
  Replace \`IPaymentGatewayPort\` adapters for production use.`,
    )
    .setVersion('1.0')
    .addTag('accounts', 'Wallet management: open, inspect, and top up accounts')
    .addTag('transactions', 'Payment holds: reserve, release, and refund funds')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(process.env.PORT ?? 3006);
}
bootstrap();
