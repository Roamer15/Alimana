import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanUpPPayementSaleItemSaleSaleReceiptsColumns1752748634533
  implements MigrationInterface
{
  name = 'CleanUpPPayementSaleItemSaleSaleReceiptsColumns1752748634533';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sale_items" DROP CONSTRAINT "FK_d675aea38a16313e844662c48f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale_items" DROP CONSTRAINT "FK_c642be08de5235317d4cf3deb40"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale-receipts" DROP CONSTRAINT "FK_0fd5f9a1cb1f59925efda72618c"`,
    );
    await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_579a13a0f8d438c6f5a0d732556"`);
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_cbe18cae039006a9c217d5a66a6"`,
    );
    await queryRunner.query(`ALTER TABLE "sale_items" DROP COLUMN "saleId"`);
    await queryRunner.query(`ALTER TABLE "sale_items" DROP COLUMN "productId"`);
    await queryRunner.query(
      `ALTER TABLE "sale-receipts" DROP CONSTRAINT "REL_0fd5f9a1cb1f59925efda72618"`,
    );
    await queryRunner.query(`ALTER TABLE "sale-receipts" DROP COLUMN "saleId"`);
    await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN "createdById"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "paymentMethodId"`);
    await queryRunner.query(
      `ALTER TABLE "sale-receipts" ADD CONSTRAINT "UQ_96d3e1b3e352a055d89992b337c" UNIQUE ("sale_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale_items" ADD CONSTRAINT "FK_c210a330b80232c29c2ad68462a" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale_items" ADD CONSTRAINT "FK_4ecae62db3f9e9cc9a368d57adb" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale-receipts" ADD CONSTRAINT "FK_96d3e1b3e352a055d89992b337c" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" ADD CONSTRAINT "FK_2ba538723e1224ec7140384033e" FOREIGN KEY ("created_by_id") REFERENCES "store_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_12fd861c33c885f01b9a7da7d93" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_12fd861c33c885f01b9a7da7d93"`,
    );
    await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_2ba538723e1224ec7140384033e"`);
    await queryRunner.query(
      `ALTER TABLE "sale-receipts" DROP CONSTRAINT "FK_96d3e1b3e352a055d89992b337c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale_items" DROP CONSTRAINT "FK_4ecae62db3f9e9cc9a368d57adb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale_items" DROP CONSTRAINT "FK_c210a330b80232c29c2ad68462a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale-receipts" DROP CONSTRAINT "UQ_96d3e1b3e352a055d89992b337c"`,
    );
    await queryRunner.query(`ALTER TABLE "payments" ADD "paymentMethodId" integer`);
    await queryRunner.query(`ALTER TABLE "sales" ADD "createdById" integer`);
    await queryRunner.query(`ALTER TABLE "sale-receipts" ADD "saleId" integer`);
    await queryRunner.query(
      `ALTER TABLE "sale-receipts" ADD CONSTRAINT "REL_0fd5f9a1cb1f59925efda72618" UNIQUE ("saleId")`,
    );
    await queryRunner.query(`ALTER TABLE "sale_items" ADD "productId" integer`);
    await queryRunner.query(`ALTER TABLE "sale_items" ADD "saleId" integer`);
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_cbe18cae039006a9c217d5a66a6" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" ADD CONSTRAINT "FK_579a13a0f8d438c6f5a0d732556" FOREIGN KEY ("createdById") REFERENCES "store_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale-receipts" ADD CONSTRAINT "FK_0fd5f9a1cb1f59925efda72618c" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale_items" ADD CONSTRAINT "FK_c642be08de5235317d4cf3deb40" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale_items" ADD CONSTRAINT "FK_d675aea38a16313e844662c48f8" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
