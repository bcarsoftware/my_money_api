import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBank1787412644065 implements MigrationInterface {
  name = "CreateBank1787412644065";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const loggedUser = `"userId" = nullif(current_setting('app.current_user_id', true), '')::uuid`;

    await queryRunner.query(
      `CREATE TYPE "public"."banks_account_type_enum" AS ENUM('SAVING', 'CHECKING', 'INVESTMENT', 'PAYMENT')`
    );
    await queryRunner.query(
      `CREATE TABLE "banks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "code" character varying(8) NOT NULL, "name" character varying(64) NOT NULL, "account_type" "public"."banks_account_type_enum" NOT NULL, "accountNumber" character varying(64) NOT NULL, "agency" character varying(32) NOT NULL, "balance" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_3975b5f684ec241e3901db62d77" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_banks_user_id_code" ON "banks"  ("user_id", "code") `
    );
    await queryRunner.query(
      `ALTER TABLE "banks" ADD CONSTRAINT "FK_bank_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `GRANT SELECT, INSERT, UPDATE ON banks TO my_money_app`
    );

    await queryRunner.query(`ALTER TABLE banks ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE banks FORCE ROW LEVEL SECURITY`);

    await queryRunner.query(`
      CREATE POLICY select_bank_logged_user ON banks
      FOR SELECT USING (${loggedUser})
    `);
    await queryRunner.query(`
      CREATE POLICY insert_bank_logged_user ON banks
      FOR INSERT WITH CHECK (${loggedUser})
    `);
    await queryRunner.query(`
      CREATE POLICY update_bank_logged_user ON banks
      FOR UPDATE USING (${loggedUser}) WITH CHECK (${loggedUser})
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE banks DISABLE ROW LEVEL SECURITY`);

    await queryRunner.query(
      `ALTER TABLE "banks" DROP CONSTRAINT "FK_bank_user_id"`
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_banks_user_id_code"`);
    await queryRunner.query(`DROP TABLE "banks"`);
    await queryRunner.query(`DROP TYPE "public"."banks_account_type_enum"`);
  }
}
