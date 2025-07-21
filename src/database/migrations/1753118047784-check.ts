import { MigrationInterface, QueryRunner } from 'typeorm';

export class Check1753118047784 implements MigrationInterface {
  name = 'Check1753118047784';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" DROP CONSTRAINT "FK_23848396a7c5924f02f6fee1987"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" DROP CONSTRAINT "FK_d1762d1b5691bc3990328c6e12f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" DROP CONSTRAINT "FK_5a1aa23955689611e290bfa1a35"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_1716ca36c57e02426645d761ff6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale_items" DROP CONSTRAINT "FK_4ecae62db3f9e9cc9a368d57adb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale-receipts" DROP CONSTRAINT "FK_96d3e1b3e352a055d89992b337c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale-receipts" DROP CONSTRAINT "FK_a3c7ba25e7e57827de79f7a9d1f"`,
    );
    await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_2ba538723e1224ec7140384033e"`);
    await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_6c1fae113ae666969a94d79d637"`);
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_2ae10d0c6fc1db90429bc56955d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_12fd861c33c885f01b9a7da7d93"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_23848396a7c5924f02f6fee198"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d1762d1b5691bc3990328c6e12"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5a1aa23955689611e290bfa1a3"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_03dddb9bb3372ec96fae18cdb7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4ef0fb3b23e3a0bdc11514270a"`);
    await queryRunner.query(`ALTER TABLE "inventory_movements" RENAME COLUMN "reason" TO "notes"`);
    await queryRunner.query(`ALTER TABLE "cash_register_sessions" DROP COLUMN "opened_by_id"`);
    await queryRunner.query(`ALTER TABLE "cash_register_sessions" DROP COLUMN "closed_by_id"`);
    await queryRunner.query(`ALTER TABLE "cash_register_sessions" DROP COLUMN "expected_cash"`);
    await queryRunner.query(`ALTER TABLE "cash_register_sessions" DROP COLUMN "discrepancy"`);
    await queryRunner.query(`ALTER TABLE "sale-receipts" DROP COLUMN "store_id"`);
    await queryRunner.query(`ALTER TABLE "sale-receipts" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."sale-receipts_type_enum"`);
    await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN "total_paid_amount"`);
    await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN "change_due"`);
    await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."sales_status_enum"`);
    await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "UQ_4ef0fb3b23e3a0bdc11514270aa"`);
    await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN "sale_number"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "processed_by_store_user_id"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "processed_by_id"`);
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" ADD "store_user_id" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" ADD "system_cash_total" numeric(12,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" ALTER COLUMN "initial_cash" DROP DEFAULT`,
    );
    await queryRunner.query(`ALTER TABLE "sale-receipts" ALTER COLUMN "sale_id" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "sale-receipts" ADD CONSTRAINT "UQ_96d3e1b3e352a055d89992b337c" UNIQUE ("sale_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9372c6cfd99a37602a2b9214d5" ON "cash_register_sessions" ("store_user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" ADD CONSTRAINT "FK_9372c6cfd99a37602a2b9214d5b" FOREIGN KEY ("store_user_id") REFERENCES "store_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" ADD CONSTRAINT "FK_5a1aa23955689611e290bfa1a35" FOREIGN KEY ("cash_register_id") REFERENCES "cash_registers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_1716ca36c57e02426645d761ff6" FOREIGN KEY ("created_by_id") REFERENCES "store_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale_items" ADD CONSTRAINT "FK_4ecae62db3f9e9cc9a368d57adb" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale-receipts" ADD CONSTRAINT "FK_96d3e1b3e352a055d89992b337c" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" ADD CONSTRAINT "FK_6c1fae113ae666969a94d79d637" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
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
    await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_6c1fae113ae666969a94d79d637"`);
    await queryRunner.query(
      `ALTER TABLE "sale-receipts" DROP CONSTRAINT "FK_96d3e1b3e352a055d89992b337c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale_items" DROP CONSTRAINT "FK_4ecae62db3f9e9cc9a368d57adb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_1716ca36c57e02426645d761ff6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" DROP CONSTRAINT "FK_5a1aa23955689611e290bfa1a35"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" DROP CONSTRAINT "FK_9372c6cfd99a37602a2b9214d5b"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_9372c6cfd99a37602a2b9214d5"`);
    await queryRunner.query(
      `ALTER TABLE "sale-receipts" DROP CONSTRAINT "UQ_96d3e1b3e352a055d89992b337c"`,
    );
    await queryRunner.query(`ALTER TABLE "sale-receipts" ALTER COLUMN "sale_id" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" ALTER COLUMN "initial_cash" SET DEFAULT '0'`,
    );
    await queryRunner.query(`ALTER TABLE "cash_register_sessions" DROP COLUMN "system_cash_total"`);
    await queryRunner.query(`ALTER TABLE "cash_register_sessions" DROP COLUMN "store_user_id"`);
    await queryRunner.query(`ALTER TABLE "payments" ADD "processed_by_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "processed_by_store_user_id" integer NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "sales" ADD "sale_number" character varying(50) NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "sales" ADD CONSTRAINT "UQ_4ef0fb3b23e3a0bdc11514270aa" UNIQUE ("sale_number")`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."sales_status_enum" AS ENUM('completed', 'pending', 'refunded', 'canceled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" ADD "status" "public"."sales_status_enum" NOT NULL DEFAULT 'completed'`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" ADD "change_due" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" ADD "total_paid_amount" numeric(10,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."sale-receipts_type_enum" AS ENUM('original', 'duplicate', 'refund')`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale-receipts" ADD "type" "public"."sale-receipts_type_enum" NOT NULL DEFAULT 'original'`,
    );
    await queryRunner.query(`ALTER TABLE "sale-receipts" ADD "store_id" integer NOT NULL`);
    await queryRunner.query(`ALTER TABLE "cash_register_sessions" ADD "discrepancy" numeric(10,2)`);
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" ADD "expected_cash" numeric(10,2)`,
    );
    await queryRunner.query(`ALTER TABLE "cash_register_sessions" ADD "closed_by_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" ADD "opened_by_id" integer NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "inventory_movements" RENAME COLUMN "notes" TO "reason"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_4ef0fb3b23e3a0bdc11514270a" ON "sales" ("sale_number") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_03dddb9bb3372ec96fae18cdb7" ON "sale-receipts" ("receipt_number") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5a1aa23955689611e290bfa1a3" ON "cash_register_sessions" ("cash_register_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d1762d1b5691bc3990328c6e12" ON "cash_register_sessions" ("closed_by_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_23848396a7c5924f02f6fee198" ON "cash_register_sessions" ("opened_by_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_12fd861c33c885f01b9a7da7d93" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_2ae10d0c6fc1db90429bc56955d" FOREIGN KEY ("processed_by_id") REFERENCES "store_users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" ADD CONSTRAINT "FK_6c1fae113ae666969a94d79d637" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" ADD CONSTRAINT "FK_2ba538723e1224ec7140384033e" FOREIGN KEY ("created_by_id") REFERENCES "store_users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale-receipts" ADD CONSTRAINT "FK_a3c7ba25e7e57827de79f7a9d1f" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale-receipts" ADD CONSTRAINT "FK_96d3e1b3e352a055d89992b337c" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale_items" ADD CONSTRAINT "FK_4ecae62db3f9e9cc9a368d57adb" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_1716ca36c57e02426645d761ff6" FOREIGN KEY ("created_by_id") REFERENCES "store_users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" ADD CONSTRAINT "FK_5a1aa23955689611e290bfa1a35" FOREIGN KEY ("cash_register_id") REFERENCES "cash_registers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" ADD CONSTRAINT "FK_d1762d1b5691bc3990328c6e12f" FOREIGN KEY ("closed_by_id") REFERENCES "store_users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" ADD CONSTRAINT "FK_23848396a7c5924f02f6fee1987" FOREIGN KEY ("opened_by_id") REFERENCES "store_users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }
}
