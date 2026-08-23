import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBankBox1787412945271 implements MigrationInterface {
  name = "CreateBankBox1787412945271";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "bank_boxes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bank_id" uuid NOT NULL, "tag" character varying(64) NOT NULL, "objective" numeric(10,2), "description" character varying(256), "balance" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_773a4b96609c57770510ea22399" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "bank_boxes" ADD CONSTRAINT "FK_bank_box_bank_id" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `GRANT SELECT, INSERT, UPDATE ON bank_boxes TO my_money_app`
    );

    await queryRunner.query(`ALTER TABLE bank_boxes ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE bank_boxes FORCE ROW LEVEL SECURITY`);

    await queryRunner.query(`
      CREATE POLICY select_bank_box_logged_user ON bank_boxes
      FOR SELECT USING (is_user_logged())
    `);
    await queryRunner.query(`
      CREATE POLICY insert_bank_box_logged_user ON bank_boxes
      FOR INSERT WITH CHECK (is_user_logged())
    `);
    await queryRunner.query(`
      CREATE POLICY update_bank_box_logged_user ON bank_boxes
      FOR UPDATE USING (is_user_logged()) WITH CHECK (is_user_logged())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP POLICY IF EXISTS select_bank_box_logged_user ON bank_boxes`
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS insert_bank_box_logged_user ON bank_boxes`
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS update_bank_box_logged_user ON bank_boxes`
    );

    await queryRunner.query(
      `ALTER TABLE bank_boxes DISABLE ROW LEVEL SECURITY`
    );

    await queryRunner.query(
      `ALTER TABLE "bank_boxes" DROP CONSTRAINT "FK_bank_box_bank_id"`
    );
    await queryRunner.query(`DROP TABLE "bank_boxes"`);
  }
}
