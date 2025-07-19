import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCashRegisterSessionAddcasgMovement1752890741461 implements MigrationInterface {
  name = 'UpdateCashRegisterSessionAddcasgMovement1752890741461';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" DROP CONSTRAINT "FK_9372c6cfd99a37602a2b9214d5b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" DROP CONSTRAINT "FK_5a1aa23955689611e290bfa1a35"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_9372c6cfd99a37602a2b9214d5"`);
    await queryRunner.query(`CREATE TYPE "public"."cash_movements_type_enum" AS ENUM('in', 'out')`);
    await queryRunner.query(
      `CREATE TABLE "cash_movements" ("id" SERIAL NOT NULL, "store_id" integer NOT NULL, "cash_register_session_id" integer NOT NULL, "type" "public"."cash_movements_type_enum" NOT NULL, "amount" numeric(10,2) NOT NULL, "description" text, "created_by_store_user_id" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "cashRegisterSessionId" integer, "createdByStoreUserId" integer, CONSTRAINT "PK_25faead19e1ff74153a01604d37" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0a089a2ba2ef40ca25185cf88f" ON "cash_movements" ("store_id") `,
    );
    await queryRunner.query(`ALTER TABLE "cash_register_sessions" DROP COLUMN "store_user_id"`);
    await queryRunner.query(`ALTER TABLE "cash_register_sessions" DROP COLUMN "system_cash_total"`);
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" ADD "opened_by_id" integer NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "cash_register_sessions" ADD "closed_by_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" ADD "expected_cash" numeric(10,2)`,
    );
    await queryRunner.query(`ALTER TABLE "cash_register_sessions" ADD "discrepancy" numeric(10,2)`);
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" ALTER COLUMN "initial_cash" SET DEFAULT '0'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_23848396a7c5924f02f6fee198" ON "cash_register_sessions" ("opened_by_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d1762d1b5691bc3990328c6e12" ON "cash_register_sessions" ("closed_by_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5a1aa23955689611e290bfa1a3" ON "cash_register_sessions" ("cash_register_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_movements" ADD CONSTRAINT "FK_0a089a2ba2ef40ca25185cf88ff" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_movements" ADD CONSTRAINT "FK_90d94b4dc5d89f0d00cb14a48fc" FOREIGN KEY ("cashRegisterSessionId") REFERENCES "cash_register_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_movements" ADD CONSTRAINT "FK_81a7a8b061738ba310373f8a4fc" FOREIGN KEY ("createdByStoreUserId") REFERENCES "store_users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" ADD CONSTRAINT "FK_23848396a7c5924f02f6fee1987" FOREIGN KEY ("opened_by_id") REFERENCES "store_users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" ADD CONSTRAINT "FK_d1762d1b5691bc3990328c6e12f" FOREIGN KEY ("closed_by_id") REFERENCES "store_users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" ADD CONSTRAINT "FK_5a1aa23955689611e290bfa1a35" FOREIGN KEY ("cash_register_id") REFERENCES "cash_registers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" DROP CONSTRAINT "FK_5a1aa23955689611e290bfa1a35"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" DROP CONSTRAINT "FK_d1762d1b5691bc3990328c6e12f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" DROP CONSTRAINT "FK_23848396a7c5924f02f6fee1987"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_movements" DROP CONSTRAINT "FK_81a7a8b061738ba310373f8a4fc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_movements" DROP CONSTRAINT "FK_90d94b4dc5d89f0d00cb14a48fc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_movements" DROP CONSTRAINT "FK_0a089a2ba2ef40ca25185cf88ff"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_5a1aa23955689611e290bfa1a3"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d1762d1b5691bc3990328c6e12"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_23848396a7c5924f02f6fee198"`);
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" ALTER COLUMN "initial_cash" DROP DEFAULT`,
    );
    await queryRunner.query(`ALTER TABLE "cash_register_sessions" DROP COLUMN "discrepancy"`);
    await queryRunner.query(`ALTER TABLE "cash_register_sessions" DROP COLUMN "expected_cash"`);
    await queryRunner.query(`ALTER TABLE "cash_register_sessions" DROP COLUMN "closed_by_id"`);
    await queryRunner.query(`ALTER TABLE "cash_register_sessions" DROP COLUMN "opened_by_id"`);
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" ADD "system_cash_total" numeric(12,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" ADD "store_user_id" integer NOT NULL`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_0a089a2ba2ef40ca25185cf88f"`);
    await queryRunner.query(`DROP TABLE "cash_movements"`);
    await queryRunner.query(`DROP TYPE "public"."cash_movements_type_enum"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_9372c6cfd99a37602a2b9214d5" ON "cash_register_sessions" ("store_user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" ADD CONSTRAINT "FK_5a1aa23955689611e290bfa1a35" FOREIGN KEY ("cash_register_id") REFERENCES "cash_registers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cash_register_sessions" ADD CONSTRAINT "FK_9372c6cfd99a37602a2b9214d5b" FOREIGN KEY ("store_user_id") REFERENCES "store_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
