import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPickupConfirmationColumns1748220003000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "pickupConfirmed" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "holdTransactionId" varchar`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "trips" DROP COLUMN IF EXISTS "holdTransactionId"`);
    await queryRunner.query(`ALTER TABLE "trips" DROP COLUMN IF EXISTS "pickupConfirmed"`);
  }
}
