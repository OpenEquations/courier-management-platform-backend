import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVersionColumn1748220002000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 1`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "trips" DROP COLUMN IF EXISTS "version"`);
  }
}
