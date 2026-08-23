import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGenericBankInfo1787415282084 implements MigrationInterface {
  name = "CreateGenericBankInfo1787415282084";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "generic_bank_info" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "generic_bank_id" uuid NOT NULL, "name" character varying(64) NOT NULL, "value" character varying(256) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_8427c04656ce5e88e7981dc9d95" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "generic_bank_info" ADD CONSTRAINT "FK_generic_bank_info_generic_bank_id" FOREIGN KEY ("generic_bank_id") REFERENCES "generic_banks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `GRANT SELECT, INSERT, UPDATE ON generic_bank_info TO my_money_app`
    );

    await queryRunner.query(
      `ALTER TABLE generic_bank_info ENABLE ROW LEVEL SECURITY`
    );
    await queryRunner.query(
      `ALTER TABLE generic_bank_info FORCE ROW LEVEL SECURITY`
    );

    await queryRunner.query(`
      CREATE POLICY select_generic_bank_info_logged_user ON generic_bank_info
      FOR SELECT USING (is_user_logged())
    `);
    await queryRunner.query(`
      CREATE POLICY insert_generic_bank_info_logged_user ON generic_bank_info
      FOR INSERT WITH CHECK (is_user_logged())
    `);
    await queryRunner.query(`
      CREATE POLICY update_generic_bank_info_logged_user ON generic_bank_info
      FOR UPDATE USING (is_user_logged()) WITH CHECK (is_user_logged())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP POLICY IF EXISTS select_generic_bank_info_logged_user ON generic_bank_info`
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS insert_generic_bank_info_logged_user ON generic_bank_info`
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS update_generic_bank_info_logged_user ON generic_bank_info`
    );

    await queryRunner.query(
      `ALTER TABLE generic_bank_info DISABLE ROW LEVEL SECURITY`
    );

    await queryRunner.query(
      `ALTER TABLE "generic_bank_info" DROP CONSTRAINT "FK_generic_bank_info_generic_bank_id"`
    );
    await queryRunner.query(`DROP TABLE "generic_bank_info"`);
  }
}
