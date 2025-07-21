import { MigrationInterface, QueryRunner } from 'typeorm';

export class Check1753108701235 implements MigrationInterface {
  name = 'Check1753108701235';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_e15427928c7a02bd304d628c41e"`,
    );
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "saleId"`);
    await queryRunner.query(`ALTER TABLE "stores" ADD "email" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "stores" ADD "logo_url" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "stores" ADD "website_url" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "stores" ADD "profile_image_url" character varying(255)`);
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_a9272c4415ef64294b104e378ac" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_a9272c4415ef64294b104e378ac"`,
    );
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "profile_image_url"`);
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "website_url"`);
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "logo_url"`);
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "email"`);
    await queryRunner.query(`ALTER TABLE "payments" ADD "saleId" integer`);
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_e15427928c7a02bd304d628c41e" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
