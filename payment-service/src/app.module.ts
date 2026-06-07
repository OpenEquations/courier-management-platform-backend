import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AccountOrmEntity } from './inflastructure/persistence/typeorm/entities/account.orm-entity';
import { TransactionOrmEntity } from './inflastructure/persistence/typeorm/entities/transaction.orm-entity';
import { TypeOrmPersistenceModule } from './inflastructure/persistence/typeorm/typeorm.module';
import { PaymentModule } from './application/payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [AccountOrmEntity, TransactionOrmEntity],
        migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
        migrationsRun: true,
        synchronize: false,
        logging: true,
        ssl: config.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
      }),
    }),
    TypeOrmPersistenceModule,
    PaymentModule,
  ],
})
export class AppModule {}
