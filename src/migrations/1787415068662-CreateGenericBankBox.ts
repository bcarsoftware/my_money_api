import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGenericBankBox1787415068662 implements MigrationInterface {
  name = "CreateGenericBankBox1787415068662";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "generic_bank_boxes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "generic_bank_id" uuid NOT NULL, "name" character varying(64) NOT NULL, "objective" numeric(10,2), "description" character varying(256), "balance" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_7aa89d2ab3d72782f7eed058f4a" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "generic_bank_boxes" ADD CONSTRAINT "FK_generic_bank_box_generic_bank_id" FOREIGN KEY ("generic_bank_id") REFERENCES "generic_banks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "generic_bank_boxes" DROP CONSTRAINT "FK_generic_bank_box_generic_bank_id"`
    );
    await queryRunner.query(`DROP TABLE "generic_bank_boxes"`);
  }
}
