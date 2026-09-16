import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreditLimitToBank1789085195409 implements MigrationInterface {
  name = "AddCreditLimitToBank1789085195409";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "banks" ADD "credit_limit" numeric(10,2)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "banks" DROP COLUMN "credit_limit"`);
  }
}
