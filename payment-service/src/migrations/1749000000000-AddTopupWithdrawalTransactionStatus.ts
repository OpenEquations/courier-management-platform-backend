import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTopupWithdrawalTransactionStatus1749000000000 implements MigrationInterface {
  name = 'AddTopupWithdrawalTransactionStatus1749000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."payment_transactions_status_enum" ADD VALUE IF NOT EXISTS 'TOPUP'`);
    await queryRunner.query(`ALTER TYPE "public"."payment_transactions_status_enum" ADD VALUE IF NOT EXISTS 'WITHDRAWAL'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Postgres does not support removing enum values; this is a no-op.
  }
}
