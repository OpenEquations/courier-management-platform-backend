import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1748220000000 implements MigrationInterface {
  name = 'InitialSchema1748220000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."users_gender_enum" AS ENUM('MALE','FEMALE','OTHER');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id"         character varying                   NOT NULL,
        "firstName"  character varying                   NOT NULL,
        "lastName"   character varying                   NOT NULL,
        "email"      character varying                   NOT NULL,
        "gender"     "public"."users_gender_enum"        NOT NULL,
        "nationalId" character varying                   NOT NULL,
        "password"   character varying                   NOT NULL,
        "isActive"   boolean                             NOT NULL DEFAULT true,
        "createdAt"  TIMESTAMP                           NOT NULL DEFAULT now(),
        "updatedAt"  TIMESTAMP                           NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email"      UNIQUE ("email"),
        CONSTRAINT "UQ_users_nationalId" UNIQUE ("nationalId"),
        CONSTRAINT "PK_users"            PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "riders" (
        "id"          character varying NOT NULL,
        "userId"      character varying NOT NULL,
        "vehicles"    jsonb             NOT NULL,
        "isAvailable" boolean           NOT NULL DEFAULT true,
        "createdAt"   TIMESTAMP         NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_riders"       PRIMARY KEY ("id"),
        CONSTRAINT "FK_riders_users" FOREIGN KEY ("userId") REFERENCES "users"("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "riders"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_gender_enum"`);
  }
}
