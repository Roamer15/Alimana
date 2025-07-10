import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexToDamagedOrExpiredItem1752147867220 implements MigrationInterface {
  name = 'AddIndexToDamagedOrExpiredItem1752147867220';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_97d8903dd14f575196b81c3aeb" ON "damaged_or_expired_items" ("product_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_97d8903dd14f575196b81c3aeb"`);
  }
}
