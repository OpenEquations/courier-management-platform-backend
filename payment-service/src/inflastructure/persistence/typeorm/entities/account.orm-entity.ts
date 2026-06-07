// infrastructure/persistence/typeorm/entities/account.orm-entity.ts

import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { AccountStatus } from "src/domain/payment/enums/account-status.enum";

@Entity("payment_accounts")
export class AccountOrmEntity {
  @PrimaryColumn()
  id!: string;

  @Index({ unique: true })
  @Column()
  ownerId!: string;

  @Column()
  ownerName!: string;

  @Column("decimal", { precision: 14, scale: 2 })
  balance!: string;

  @Column("decimal", { precision: 14, scale: 2 })
  heldBalance!: string;

  @Column({ length: 3 })
  currency!: string;

  @Column({ type: "enum", enum: AccountStatus, default: AccountStatus.ACTIVE })
  status!: AccountStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
