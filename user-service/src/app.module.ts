import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserOrmEntity } from './inflastructure/persistence/typeorm/entities/user.orm-entity';
import { TypeOrmPersistenceModule } from './inflastructure/persistence/typeorm/typeorm.module';
import { UserModule } from './application/user/user.module';

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
        entities: [UserOrmEntity],
        synchronize: config.get<boolean>('DB_SYNCHRONIZE', false),
        logging: true,
        ssl: { rejectUnauthorized: false },
      }),
    }),
    TypeOrmPersistenceModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
