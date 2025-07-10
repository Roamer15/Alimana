import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexToCreateById1752148665809 implements MigrationInterface {
  name = 'AddIndexToCreateById1752148665809';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_2ba538723e1224ec7140384033" ON "sales" ("created_by_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_2ba538723e1224ec7140384033"`);
  }
}
