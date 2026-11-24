import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeCategoryStatusToEnum1795032000000 implements MigrationInterface {
  name = 'ChangeCategoryStatusToEnum1795032000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "categories_status_enum" AS ENUM ('active', 'inactive')`);
    await queryRunner.query(`ALTER TABLE "categories" RENAME COLUMN "is_active" TO "status"`);
    await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "categories" ALTER COLUMN "status" TYPE "categories_status_enum" USING (CASE WHEN "status" THEN 'active' ELSE 'inactive' END)::"categories_status_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "status" SET DEFAULT 'active'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "status" TYPE boolean USING ("status" = 'active')`);
    await queryRunner.query(`ALTER TABLE "categories" RENAME COLUMN "status" TO "is_active"`);
    await queryRunner.query(`DROP TYPE "categories_status_enum"`);
  }
}
