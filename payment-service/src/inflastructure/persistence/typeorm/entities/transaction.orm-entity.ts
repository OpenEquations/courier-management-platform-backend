// infrastructure/persistence/typeorm/entities/transaction.orm-entity.ts

import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { TransactionStatus } from "src/domain/payment/enums/transaction-status.enum";

@Entity("payment_transactions")
export class TransactionOrmEntity {
  @PrimaryColumn()
  id!: string;

  @Index()
  @Column()
  accountId!: string;

  @Index()
  @Column()
  payerId!: string;

  @Column("decimal", { precision: 14, scale: 2 })
  amount!: string;

  @Column({ length: 3 })
  currency!: string;

  @Column({ type: "enum", enum: TransactionStatus, default: TransactionStatus.HELD })
  status!: TransactionStatus;

  @Column({ type: "varchar", nullable: true })
  reference!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
