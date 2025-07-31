import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixRolePermissionsJoinTable1752747744153 implements MigrationInterface {
  name = 'FixRolePermissionsJoinTable1752747744153';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_06792d0c62ce6b0203c03643cdd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_b4599f8b8f548d35850afa2d12c"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_b4599f8b8f548d35850afa2d12"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_06792d0c62ce6b0203c03643cd"`);
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "PK_d430a02aad006d8a70f3acd7d03"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "PK_06792d0c62ce6b0203c03643cdd" PRIMARY KEY ("permissionId")`,
    );
    await queryRunner.query(`ALTER TABLE "role_permissions" DROP COLUMN "roleId"`);
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "PK_06792d0c62ce6b0203c03643cdd"`,
    );
    await queryRunner.query(`ALTER TABLE "role_permissions" DROP COLUMN "permissionId"`);
    await queryRunner.query(`ALTER TABLE "role_permissions" ADD "role_id" integer NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "PK_178199805b901ccd220ab7740ec" PRIMARY KEY ("role_id")`,
    );
    await queryRunner.query(`ALTER TABLE "role_permissions" ADD "permission_id" integer NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "PK_178199805b901ccd220ab7740ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "PK_25d24010f53bb80b78e412c9656" PRIMARY KEY ("role_id", "permission_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_178199805b901ccd220ab7740e" ON "role_permissions" ("role_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_17022daf3f885f7d35423e9971" ON "role_permissions" ("permission_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_17022daf3f885f7d35423e9971"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_178199805b901ccd220ab7740e"`);
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "PK_25d24010f53bb80b78e412c9656"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "PK_178199805b901ccd220ab7740ec" PRIMARY KEY ("role_id")`,
    );
    await queryRunner.query(`ALTER TABLE "role_permissions" DROP COLUMN "permission_id"`);
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "PK_178199805b901ccd220ab7740ec"`,
    );
    await queryRunner.query(`ALTER TABLE "role_permissions" DROP COLUMN "role_id"`);
    await queryRunner.query(`ALTER TABLE "role_permissions" ADD "permissionId" integer NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "PK_06792d0c62ce6b0203c03643cdd" PRIMARY KEY ("permissionId")`,
    );
    await queryRunner.query(`ALTER TABLE "role_permissions" ADD "roleId" integer NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "PK_06792d0c62ce6b0203c03643cdd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "PK_d430a02aad006d8a70f3acd7d03" PRIMARY KEY ("roleId", "permissionId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_06792d0c62ce6b0203c03643cd" ON "role_permissions" ("permissionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b4599f8b8f548d35850afa2d12" ON "role_permissions" ("roleId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_b4599f8b8f548d35850afa2d12c" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_06792d0c62ce6b0203c03643cdd" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
