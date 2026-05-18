import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DeliveryOrmEntity } from './inflastructure/persistence/typeorm/entities/delivery.orm-entity';
import { OutboxEventOrmEntity } from './inflastructure/persistence/typeorm/entities/outbox-event.orm-entity';
import { ProcessedEventOrmEntity } from './inflastructure/persistence/typeorm/entities/processed-event.orm-entity';
import { TypeOrmPersistenceModule } from './inflastructure/persistence/typeorm/typeorm.module';
import { DeliveryModule } from './application/delivery/delivery.module';

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
        entities: [DeliveryOrmEntity, OutboxEventOrmEntity, ProcessedEventOrmEntity],
        migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
        migrationsRun: true,
        synchronize: false,
        logging: true,
        ssl: config.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
      }),
    }),
    TypeOrmPersistenceModule,
    DeliveryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
