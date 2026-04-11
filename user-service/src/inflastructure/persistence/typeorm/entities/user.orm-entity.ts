// infrastructure/persistence/typeorm/entities/user.orm-entity.ts

import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Gender } from "src/domain/user/enums";

@Entity("users")
export class UserOrmEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ type: "enum", enum: Gender })
  gender!: Gender;

  @Column({ unique: true })
  nationalId!: string;

  @Column()
  password!: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}