import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('processed_events')
export class ProcessedEventOrmEntity {
  @PrimaryColumn()
  eventId!: string;

  @Column()
  eventType!: string;

  @Column()
  processedAt!: Date;
}
