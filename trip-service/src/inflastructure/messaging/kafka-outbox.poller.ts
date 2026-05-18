import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interval } from '@nestjs/schedule';
import { Kafka, Producer } from 'kafkajs';
import { OutboxEventOrmEntity } from 'src/inflastructure/persistence/typeorm/entities/outbox-event.orm-entity';

const TOPIC = 'trip.events';
const POLL_BATCH = 20;

@Injectable()
export class KafkaOutboxPoller implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaOutboxPoller.name);
  private producer!: Producer;

  constructor(
    @InjectRepository(OutboxEventOrmEntity)
    private readonly outboxRepo: Repository<OutboxEventOrmEntity>,
  ) {}

  async onModuleInit() {
    const kafka = new Kafka({
      clientId: 'trip-service-producer',
      brokers: [(process.env.KAFKA_BROKER ?? 'localhost:9092')],
      retry: { retries: 10 },
    });
    this.producer = kafka.producer();
    await this.producer.connect();
    this.logger.log('Kafka producer connected');
  }

  async onModuleDestroy() {
    await this.producer?.disconnect();
  }

  @Interval(1000)
  async poll() {
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
      }
    }
  }
}
