import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddParcelAndPickupImages1748220002000 implements MigrationInterface {
  name = 'AddParcelAndPickupImages1748220002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "deliveries"
      ADD COLUMN IF NOT EXISTS "parcelImages" jsonb NOT NULL DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS "pickupImages" jsonb NOT NULL DEFAULT '[]'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "deliveries"
      DROP COLUMN IF EXISTS "pickupImages",
      DROP COLUMN IF EXISTS "parcelImages"
    `);
  }
}
