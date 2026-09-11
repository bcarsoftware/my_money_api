import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreditLimitToGenericBank1789085342041 implements MigrationInterface {
  name = "AddCreditLimitToGenericBank1789085342041";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "generic_banks" ADD "credit_limit" numeric(10,2)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "generic_banks" DROP COLUMN "credit_limit"`
    );
  }
}
