import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGenericBankInfo1787415282084 implements MigrationInterface {
  name = "CreateGenericBankInfo1787415282084";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "generic_bank_info" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "generic_bank_id" uuid NOT NULL, "name" character varying(64) NOT NULL, "value" character varying(256) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_8427c04656ce5e88e7981dc9d95" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "generic_bank_info" ADD CONSTRAINT "FK_2d2518fbc938cf35429a47f4dea" FOREIGN KEY ("generic_bank_id") REFERENCES "generic_banks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "generic_bank_info" DROP CONSTRAINT "FK_2d2518fbc938cf35429a47f4dea"`
    );
    await queryRunner.query(`DROP TABLE "generic_bank_info"`);
  }
}
