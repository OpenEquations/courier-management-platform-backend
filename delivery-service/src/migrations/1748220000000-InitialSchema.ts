import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1748220000000 implements MigrationInterface {
  name = 'InitialSchema1748220000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."deliveries_status_enum" AS ENUM(
          'CREATED','ASSIGNED','PICKED_UP','IN_TRANSIT',
          'OUT_FOR_DELIVERY','DELIVERED','FAILED_DELIVERY',
          'RETURNED','CANCELLED'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "deliveries" (
        "id"                   character varying     NOT NULL,
        "trackingNumber"       character varying     NOT NULL,
        "sender"               jsonb                 NOT NULL,
        "recipient"            jsonb                 NOT NULL,
        "pickupLocation"       jsonb                 NOT NULL,
        "dropoffLocation"      jsonb                 NOT NULL,
        "packageDetails"       jsonb                 NOT NULL,
        "deliveryWindow"       jsonb,
        "specialInstructions"  character varying,
        "codInfo"              jsonb,
        "status"               "public"."deliveries_status_enum" NOT NULL DEFAULT 'CREATED',
        "currentTripId"        character varying,
        "proofOfPickup"        jsonb,
        "proofOfDelivery"      jsonb,
        "attempts"             jsonb                 NOT NULL DEFAULT '[]',
        "timeline"             jsonb                 NOT NULL DEFAULT '[]',
        "cancellationReason"   character varying,
        "createdAt"            TIMESTAMP             NOT NULL DEFAULT now(),
        "updatedAt"            TIMESTAMP             NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_deliveries_trackingNumber" UNIQUE ("trackingNumber"),
        CONSTRAINT "PK_deliveries" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "outbox_events" (
        "id"          character varying NOT NULL,
        "eventType"   character varying NOT NULL,
        "aggregateId" character varying NOT NULL,
        "payload"     jsonb             NOT NULL,
        "published"   boolean           NOT NULL DEFAULT false,
        "publishedAt" TIMESTAMP,
        "createdAt"   TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_outbox_events" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "processed_events" (
        "eventId"     character varying NOT NULL,
        "eventType"   character varying NOT NULL,
        "processedAt" TIMESTAMP         NOT NULL,
        CONSTRAINT "PK_processed_events" PRIMARY KEY ("eventId")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "processed_events"`);
    await queryRunner.query(`DROP TABLE "outbox_events"`);
    await queryRunner.query(`DROP TABLE "deliveries"`);
    await queryRunner.query(`DROP TYPE "public"."deliveries_status_enum"`);
  }
}
