import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryToPermissions1752635941611 implements MigrationInterface {
  name = 'AddCategoryToPermissions1752635941611';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Étape 1: Ajouter la colonne 'category' en tant que NULLABLE.
    // Cette étape va réussir même s'il y a des données existantes.
    await queryRunner.query(`ALTER TABLE "permissions" ADD "category" character varying(100)`);

    // Étape 2: Mettre à jour toutes les lignes existantes
    // Remplacez 'General' par la catégorie par défaut que vous souhaitez.
    await queryRunner.query(
      `UPDATE "permissions" SET "category" = 'General' WHERE "category" IS NULL`,
    );

    // Étape 3: Modifier la colonne 'category' pour la rendre NOT NULL.
    // Cette étape ne réussira que parce que toutes les valeurs NULL ont été remplies à l'étape 2.
    await queryRunner.query(`ALTER TABLE "permissions" ALTER COLUMN "category" SET NOT NULL`);

    // Ensuite, vous pouvez créer l'index
    await queryRunner.query(
      `CREATE INDEX "IDX_aad80a27f0a425bfc3f092a732" ON "permissions" ("category") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_aad80a27f0a425bfc3f092a732"`);
    await queryRunner.query(`ALTER TABLE "permissions" DROP COLUMN "category"`);
  }
}
