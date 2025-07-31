import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanUpStoreUserColumns1752747364027 implements MigrationInterface {
  name = 'CleanUpStoreUserColumns1752747364027';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "store_users" DROP CONSTRAINT "FK_333dbe1ccd63089660ffbb1c35f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_users" DROP CONSTRAINT "FK_33788f3b8b1f941eee2a81915e3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_users" DROP CONSTRAINT "FK_42238d178964a4b4e9ceb8c3b12"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_42238d178964a4b4e9ceb8c3b1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_33788f3b8b1f941eee2a81915e"`);
    await queryRunner.query(`ALTER TABLE "store_users" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "store_users" DROP COLUMN "storeId"`);
    await queryRunner.query(`ALTER TABLE "store_users" DROP COLUMN "roleId"`);
    await queryRunner.query(`ALTER TABLE "permissions" ALTER COLUMN "category" DROP NOT NULL`);
    await queryRunner.query(
      `CREATE INDEX "IDX_d741d647a3ef6419a31592f8ad" ON "store_users" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3077a42ec6ad94cfb93f919359" ON "store_users" ("store_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "store_users" ADD CONSTRAINT "FK_d741d647a3ef6419a31592f8ad6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_users" ADD CONSTRAINT "FK_3077a42ec6ad94cfb93f919359d" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_users" ADD CONSTRAINT "FK_ba2b5410f84b94c4476525114b0" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "store_users" DROP CONSTRAINT "FK_ba2b5410f84b94c4476525114b0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_users" DROP CONSTRAINT "FK_3077a42ec6ad94cfb93f919359d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_users" DROP CONSTRAINT "FK_d741d647a3ef6419a31592f8ad6"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_3077a42ec6ad94cfb93f919359"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d741d647a3ef6419a31592f8ad"`);
    await queryRunner.query(`ALTER TABLE "permissions" ALTER COLUMN "category" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "store_users" ADD "roleId" integer`);
    await queryRunner.query(`ALTER TABLE "store_users" ADD "storeId" integer`);
    await queryRunner.query(`ALTER TABLE "store_users" ADD "userId" integer`);
    await queryRunner.query(
      `CREATE INDEX "IDX_33788f3b8b1f941eee2a81915e" ON "store_users" ("storeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_42238d178964a4b4e9ceb8c3b1" ON "store_users" ("userId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "store_users" ADD CONSTRAINT "FK_42238d178964a4b4e9ceb8c3b12" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_users" ADD CONSTRAINT "FK_33788f3b8b1f941eee2a81915e3" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_users" ADD CONSTRAINT "FK_333dbe1ccd63089660ffbb1c35f" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
