import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailProfilUrlToStore1752632912376 implements MigrationInterface {
  name = 'AddEmailProfilUrlToStore1752632912376';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stores" DROP CONSTRAINT "FK_c03f4f73d83362cabb34dfa9418"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_aad80a27f0a425bfc3f092a732"`);
    await queryRunner.query(`ALTER TABLE "permissions" DROP COLUMN "category"`);
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "owner_id"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "created_at"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "notes"`);
    await queryRunner.query(`ALTER TABLE "stores" ADD "email" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "stores" ADD "logo_url" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "stores" ADD "website_url" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "stores" ADD "profile_image_url" character varying(255)`);
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD "timestamp" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_0180a787e8b2c27d6e9e0fe7239"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_98472fa33e94a9f41f3ee6d88b"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" ALTER COLUMN "store_user_id" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TYPE "public"."audit_logs_action_type_enum" RENAME TO "audit_logs_action_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."audit_logs_action_type_enum" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ALTER COLUMN "action_type" TYPE "public"."audit_logs_action_type_enum" USING "action_type"::"text"::"public"."audit_logs_action_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."audit_logs_action_type_enum_old"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_85c204d8e47769ac183b32bf9c"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "entity_id"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" ADD "entity_id" integer NOT NULL`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "old_value"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" ADD "old_value" json`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "new_value"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" ADD "new_value" json`);
    await queryRunner.query(
      `CREATE INDEX "IDX_85c204d8e47769ac183b32bf9c" ON "audit_logs" ("entity_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_98472fa33e94a9f41f3ee6d88b" ON "audit_logs" ("action_type", "entity", "entity_id", "store_id", "store_user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_0180a787e8b2c27d6e9e0fe7239" FOREIGN KEY ("store_user_id") REFERENCES "store_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_0180a787e8b2c27d6e9e0fe7239"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_98472fa33e94a9f41f3ee6d88b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_85c204d8e47769ac183b32bf9c"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "new_value"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" ADD "new_value" jsonb`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "old_value"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" ADD "old_value" jsonb`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "entity_id"`);
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD "entity_id" character varying(255) NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_85c204d8e47769ac183b32bf9c" ON "audit_logs" ("entity_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."audit_logs_action_type_enum_old" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'ROLE_ASSIGN', 'INVITATION_SENT', 'CASH_REGISTER_SESSION_OPENED', 'CASH_REGISTER_SESSION_CLOSED', 'SALE_CREATED', 'SALE_UPDATED', 'SALE_COMPLETED', 'SALE_CANCELLED', 'INVENTORY_MOVEMENT_CREATED', 'INVENTORY_MOVEMENT_UPDATED', 'INVENTORY_MOVEMENT_APPROVED', 'INVENTORY_MOVEMENT_REJECTED', 'CUSTOMER_RETURN_CREATED', 'CUSTOMER_RETURN_PROCESSED', 'CUSTOMER_RETURN_CANCELLED', 'DAMAGE_REPORT_CREATED', 'DAMAGE_REPORT_APPROVED', 'DAMAGE_REPORT_REJECTED', 'REPORT_GENERATED', 'PRODUCT_STOCK_ADJUSTED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ALTER COLUMN "action_type" TYPE "public"."audit_logs_action_type_enum_old" USING "action_type"::"text"::"public"."audit_logs_action_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."audit_logs_action_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."audit_logs_action_type_enum_old" RENAME TO "audit_logs_action_type_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "audit_logs" ALTER COLUMN "store_user_id" DROP NOT NULL`);
    await queryRunner.query(
      `CREATE INDEX "IDX_98472fa33e94a9f41f3ee6d88b" ON "audit_logs" ("store_id", "store_user_id", "action_type", "entity", "entity_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_0180a787e8b2c27d6e9e0fe7239" FOREIGN KEY ("store_user_id") REFERENCES "store_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "timestamp"`);
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "profile_image_url"`);
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "website_url"`);
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "logo_url"`);
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "email"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" ADD "notes" text`);
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "stores" ADD "owner_id" integer NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "permissions" ADD "category" character varying(100) NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aad80a27f0a425bfc3f092a732" ON "permissions" ("category") `,
    );
    await queryRunner.query(
      `ALTER TABLE "stores" ADD CONSTRAINT "FK_c03f4f73d83362cabb34dfa9418" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
