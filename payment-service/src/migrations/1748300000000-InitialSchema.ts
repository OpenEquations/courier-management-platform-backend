import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1748300000000 implements MigrationInterface {
  name = 'InitialSchema1748300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."payment_accounts_status_enum" AS ENUM('ACTIVE','SUSPENDED');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."payment_transactions_status_enum" AS ENUM('HELD','RELEASED','REFUNDED');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_accounts" (
        "id"          character varying                               NOT NULL,
        "ownerId"     character varying                               NOT NULL,
        "ownerName"   character varying                               NOT NULL,
        "balance"     numeric(14,2)                                   NOT NULL,
        "heldBalance" numeric(14,2)                                   NOT NULL,
        "currency"    character varying(3)                            NOT NULL,
        "status"      "public"."payment_accounts_status_enum"         NOT NULL DEFAULT 'ACTIVE',
        "createdAt"   TIMESTAMP                                       NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP                                       NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_payment_accounts_ownerId" UNIQUE ("ownerId"),
        CONSTRAINT "PK_payment_accounts"         PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_transactions" (
        "id"        character varying                                   NOT NULL,
        "accountId" character varying                                   NOT NULL,
        "payerId"   character varying                                   NOT NULL,
        "amount"    numeric(14,2)                                       NOT NULL,
        "currency"  character varying(3)                                NOT NULL,
        "status"    "public"."payment_transactions_status_enum"         NOT NULL DEFAULT 'HELD',
        "reference" character varying,
        "createdAt" TIMESTAMP                                           NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP                                           NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payment_transactions"         PRIMARY KEY ("id"),
        CONSTRAINT "FK_payment_transactions_account" FOREIGN KEY ("accountId") REFERENCES "payment_accounts"("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_payment_transactions_accountId" ON "payment_transactions" ("accountId")`);
    await queryRunner.query(`CREATE INDEX "IDX_payment_transactions_payerId" ON "payment_transactions" ("payerId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_payment_transactions_payerId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_payment_transactions_accountId"`);
    await queryRunner.query(`DROP TABLE "payment_transactions"`);
    await queryRunner.query(`DROP TABLE "payment_accounts"`);
    await queryRunner.query(`DROP TYPE "public"."payment_transactions_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payment_accounts_status_enum"`);
  }
}
