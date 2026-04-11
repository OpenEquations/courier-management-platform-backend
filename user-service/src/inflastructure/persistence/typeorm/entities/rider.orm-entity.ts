// infrastructure/persistence/typeorm/entities/rider.orm-entity.ts

import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserOrmEntity } from "./user.orm-entity";

@Entity("riders")
export class RiderOrmEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => UserOrmEntity, { eager: false })
  @JoinColumn({ name: "userId" })
  user!: UserOrmEntity;

  @Column({ type: "jsonb" })
  vehicles!: { type: string; licensePlate: string }[];

  @Column({ default: true })
  isAvailable!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
