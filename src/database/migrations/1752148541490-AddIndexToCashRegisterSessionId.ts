import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexToCashRegisterSessionId1752148541490 implements MigrationInterface {
  name = 'AddIndexToCashRegisterSessionId1752148541490';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_76f6480dfae76102eb6ffeed24" ON "sales" ("cash_register_session_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_76f6480dfae76102eb6ffeed24"`);
  }
}
