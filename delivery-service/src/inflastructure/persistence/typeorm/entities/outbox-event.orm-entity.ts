import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('outbox_events')
export class OutboxEventOrmEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  eventType!: string;

  @Column()
  aggregateId!: string;

  @Column('jsonb')
  payload!: object;

  @Column({ default: false })
  published!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
