import 'dotenv/config';
import { DataSource } from 'typeorm';
import { join } from 'path';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: +(process.env.DB_PORT ?? '5436'),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'trip_db',
  entities: [join(__dirname, 'src/inflastructure/persistence/typeorm/entities', '*.orm-entity.{ts,js}')],
  migrations: [join(__dirname, 'src/migrations', '*.{ts,js}')],
});
