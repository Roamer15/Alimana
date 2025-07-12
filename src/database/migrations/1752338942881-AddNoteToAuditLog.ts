import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNoteToAuditLog1752338942881 implements MigrationInterface {
  name = 'AddNoteToAuditLog1752338942881';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_e15427928c7a02bd304d628c41e"`,
    );
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "saleId"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" ADD "notes" text`);
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_a9272c4415ef64294b104e378ac" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_a9272c4415ef64294b104e378ac"`,
    );
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "notes"`);
    await queryRunner.query(`ALTER TABLE "payments" ADD "saleId" integer`);
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_e15427928c7a02bd304d628c41e" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
