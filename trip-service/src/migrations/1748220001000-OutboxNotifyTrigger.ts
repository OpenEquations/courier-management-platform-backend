import { MigrationInterface, QueryRunner } from 'typeorm';

export class OutboxNotifyTrigger1748220001000 implements MigrationInterface {
  name = 'OutboxNotifyTrigger1748220001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Function: fires pg_notify on every INSERT into outbox_events
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION notify_outbox_ready()
      RETURNS TRIGGER AS $$
      BEGIN
        PERFORM pg_notify('outbox_ready', '');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Trigger: runs the function after each INSERT (one notify per row is fine —
    // the poller drains the whole batch when it wakes up)
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS outbox_insert_notify ON outbox_events;
      CREATE TRIGGER outbox_insert_notify
        AFTER INSERT ON outbox_events
        FOR EACH ROW
        EXECUTE FUNCTION notify_outbox_ready();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS outbox_insert_notify ON outbox_events`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS notify_outbox_ready`);
  }
}
