import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1748220000000 implements MigrationInterface {
  name = 'InitialSchema1748220000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."trips_type_enum" AS ENUM('STANDARD','EXPRESS','SCHEDULED','PACKAGE');
      EXCEPTION WHEN duplicate_object THEN null; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."trips_requestedvehicletype_enum" AS ENUM('MOTORCYCLE','BICYCLE','CAR','VAN','TRUCK');
      EXCEPTION WHEN duplicate_object THEN null; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."trips_tripstatus_enum" AS ENUM('PENDING','ONGOING','COMPLETED','CANCELLED','DISPUTED');
      EXCEPTION WHEN duplicate_object THEN null; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."trips_broadcaststatus_enum" AS ENUM('OPEN','LOCKED','CLOSED');
      EXCEPTION WHEN duplicate_object THEN null; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."trips_paymentstatus_enum" AS ENUM('INITIAL','HELD','RELEASED','REFUNDED');
      EXCEPTION WHEN duplicate_object THEN null; END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "trips" (
        "id"                   character varying                          NOT NULL,
        "type"                 "public"."trips_type_enum"                 NOT NULL,
        "passengerId"          character varying                          NOT NULL,
        "riderId"              character varying,
        "originLat"            double precision                           NOT NULL,
        "originLng"            double precision                           NOT NULL,
        "originAddress"        character varying                          NOT NULL,
        "destinationLat"       double precision                           NOT NULL,
        "destinationLng"       double precision                           NOT NULL,
        "destinationAddress"   character varying                          NOT NULL,
        "requestedVehicleType" "public"."trips_requestedvehicletype_enum" NOT NULL,
        "vehicleType"          character varying,
        "vehicleLicensePlate"  character varying,
        "predictedPrice"       double precision                           NOT NULL,
        "agreedPrice"          double precision,
        "tripStatus"           "public"."trips_tripstatus_enum"           NOT NULL DEFAULT 'PENDING',
        "broadcastStatus"      "public"."trips_broadcaststatus_enum"      NOT NULL DEFAULT 'OPEN',
        "paymentStatus"        "public"."trips_paymentstatus_enum"        NOT NULL DEFAULT 'INITIAL',
        "paymentSplits"        jsonb                                      NOT NULL DEFAULT '[]',
        "timeline"             jsonb                                      NOT NULL DEFAULT '[]',
        "notes"                text,
        "distance"             double precision,
        "estimatedDuration"    double precision,
        "cancellationReason"   text,
        "disputeReason"        text,
        "packageDetails"       jsonb,
        "deliveryId"           character varying,
        "createdAt"            TIMESTAMP                                  NOT NULL DEFAULT now(),
        "updatedAt"            TIMESTAMP                                  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_trips" PRIMARY KEY ("id")
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
    await queryRunner.query(`DROP TABLE "trips"`);
    await queryRunner.query(`DROP TYPE "public"."trips_paymentstatus_enum"`);
    await queryRunner.query(`DROP TYPE "public"."trips_broadcaststatus_enum"`);
    await queryRunner.query(`DROP TYPE "public"."trips_tripstatus_enum"`);
    await queryRunner.query(`DROP TYPE "public"."trips_requestedvehicletype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."trips_type_enum"`);
  }
}
