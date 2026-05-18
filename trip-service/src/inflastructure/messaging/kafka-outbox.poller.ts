import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kafka, Producer } from 'kafkajs';
import { Client } from 'pg';
import { OutboxEventOrmEntity } from 'src/inflastructure/persistence/typeorm/entities/outbox-event.orm-entity';

const TOPIC = 'trip.events';
const POLL_BATCH = 20;
const LISTEN_CHANNEL = 'outbox_ready';
const FALLBACK_INTERVAL_MS = 30_000;
const RECONNECT_DELAY_MS = 5_000;

@Injectable()
export class KafkaOutboxPoller implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaOutboxPoller.name);
  private producer!: Producer;
  private listenClient!: Client;
  private fallbackTimer!: NodeJS.Timeout;
  private polling = false;

  constructor(
    @InjectRepository(OutboxEventOrmEntity)
    private readonly outboxRepo: Repository<OutboxEventOrmEntity>,
  ) {}

  async onModuleInit() {
    const kafka = new Kafka({
      clientId: 'trip-service-producer',
      brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'],
      retry: { retries: 10 },
    });
    this.producer = kafka.producer();
    await this.producer.connect();
    this.logger.log('Kafka producer connected');

    // Fire-and-forget — fallback interval covers the gap while connecting
    this.connectAndListen();

    // Slow fallback: catches anything missed during a LISTEN reconnect window
    this.fallbackTimer = setInterval(() => this.poll(), FALLBACK_INTERVAL_MS);

    // Drain anything that accumulated while the service was offline
    await this.poll();

    this.logger.log(`Outbox poller ready (LISTEN/${LISTEN_CHANNEL} + ${FALLBACK_INTERVAL_MS / 1000}s fallback)`);
  }

  async onModuleDestroy() {
    clearInterval(this.fallbackTimer);
    await this.listenClient?.end().catch(() => {});
    await this.producer?.disconnect();
  }

  private buildPgClient(): Client {
    return new Client({
      host:     process.env.DB_HOST     ?? 'localhost',
      port:     parseInt(process.env.DB_PORT ?? '5432', 10),
      user:     process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_NAME     ?? 'trip_db',
    });
  }

  private async connectAndListen(): Promise<void> {
    try {
      this.listenClient = this.buildPgClient();
      await this.listenClient.connect();
      await this.listenClient.query(`LISTEN ${LISTEN_CHANNEL}`);

      // Wake up immediately whenever Postgres notifies us of a new outbox row
      this.listenClient.on('notification', () => this.poll());

      this.listenClient.on('error', (err) => {
        this.logger.warn(`LISTEN client error: ${err.message} — reconnecting in ${RECONNECT_DELAY_MS / 1000}s`);
        this.listenClient.end().catch(() => {});
        setTimeout(() => this.connectAndListen(), RECONNECT_DELAY_MS);
      });

      this.logger.log(`LISTEN connection established on channel "${LISTEN_CHANNEL}"`);
    } catch (err) {
      this.logger.warn(`LISTEN connect failed: ${(err as Error).message} — retrying in ${RECONNECT_DELAY_MS / 1000}s`);
      setTimeout(() => this.connectAndListen(), RECONNECT_DELAY_MS);
    }
  }

  private async poll(): Promise<void> {
    // Guard: don't start a second poll if one is already running
    if (this.polling) return;
    this.polling = true;

    try {
      const rows = await this.outboxRepo.find({
        where: { published: false },
        order: { createdAt: 'ASC' },
        take: POLL_BATCH,
      });

      if (!rows.length) return;

      for (const row of rows) {
        try {
          await this.producer.send({
            topic: TOPIC,
            messages: [{ key: row.aggregateId, value: JSON.stringify(row.payload) }],
          });
          row.published = true;
          row.publishedAt = new Date();
          await this.outboxRepo.save(row);
        } catch (err) {
          this.logger.error(`Failed to publish outbox event ${row.id}: ${(err as Error).message}`);
          // Leave unpublished — next poll (LISTEN or fallback) will retry
        }
      }
    } finally {
      this.polling = false;
    }
  }
}
