import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateReceiptSaleRelation1752150941403 implements MigrationInterface {
  name = 'UpdateReceiptSaleRelation1752150941403';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sale-receipts" DROP CONSTRAINT "FK_0fd5f9a1cb1f59925efda72618c"`,
    );
    await queryRunner.query(`ALTER TABLE "sale-receipts" ALTER COLUMN "sale_id" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "sale-receipts" ADD CONSTRAINT "FK_0fd5f9a1cb1f59925efda72618c" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sale-receipts" DROP CONSTRAINT "FK_0fd5f9a1cb1f59925efda72618c"`,
    );
    await queryRunner.query(`ALTER TABLE "sale-receipts" ALTER COLUMN "sale_id" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "sale-receipts" ADD CONSTRAINT "FK_0fd5f9a1cb1f59925efda72618c" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
