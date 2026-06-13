import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhoneToUser1748220000001 implements MigrationInterface {
  name = 'AddPhoneToUser1748220000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "phone" character varying NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
  }
}
