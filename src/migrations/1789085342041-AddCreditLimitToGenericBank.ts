import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreditLimitToGenericBank1789085342041 implements MigrationInterface {
  name = "AddCreditLimitToGenericBank1789085342041";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "generic_banks" ADD "credit_limit" numeric(10,2) default 0.00`
    );
    await queryRunner.query(
      `ALTER TABLE "generic_banks" ADD "actual_limit" numeric(10,2) default 0.00`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "generic_banks" DROP COLUMN "actual_limit"`
    );
    await queryRunner.query(
      `ALTER TABLE "generic_banks" DROP COLUMN "credit_limit"`
    );
  }
}
