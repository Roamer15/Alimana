import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTimestampToCreatedAt1752402467405 implements MigrationInterface {
  name = 'RenameTimestampToCreatedAt1752402467405';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "audit_logs" RENAME COLUMN "timestamp" TO "created_at"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "audit_logs" RENAME COLUMN "created_at" TO "timestamp"`);
  }
}
