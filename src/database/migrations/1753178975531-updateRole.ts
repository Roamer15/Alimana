import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateRole1753178975531 implements MigrationInterface {
  name = 'UpdateRole1753178975531';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "roles" DROP CONSTRAINT "FK_b935d19ac231701703cb345a140"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP CONSTRAINT "FK_6869561b4803c2d95076d83cfbc"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "storeId"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "createdByUserId"`);
    await queryRunner.query(`ALTER TABLE "roles" ADD "created_by_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "FK_c9f877a44914320ba21b00b7465" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "FK_4a4bff0f02e88cbdf770241ca8f" FOREIGN KEY ("created_by_id") REFERENCES "store_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "roles" DROP CONSTRAINT "FK_4a4bff0f02e88cbdf770241ca8f"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP CONSTRAINT "FK_c9f877a44914320ba21b00b7465"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "created_by_id"`);
    await queryRunner.query(`ALTER TABLE "roles" ADD "createdByUserId" integer`);
    await queryRunner.query(`ALTER TABLE "roles" ADD "storeId" integer`);
    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "FK_6869561b4803c2d95076d83cfbc" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "FK_b935d19ac231701703cb345a140" FOREIGN KEY ("createdByUserId") REFERENCES "store_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
