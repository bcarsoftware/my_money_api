import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexGenericBankInfo1788806787561 implements MigrationInterface {
  name = "AddIndexGenericBankInfo1788806787561";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_name_generic_bank_id" ON "generic_bank_info"  ("name", "generic_bank_id") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_name_generic_bank_id"`);
  }
}
