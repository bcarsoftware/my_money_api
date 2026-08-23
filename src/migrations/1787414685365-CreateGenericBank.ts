import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGenericBank1787414685365 implements MigrationInterface {
  name = "CreateGenericBank1787414685365";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const loggedUser = `"user_id" = nullif(current_setting('app.current_user_id', true), '')::uuid`;

    await queryRunner.query(
      `CREATE TYPE "public"."generic_banks_currency_enum" AS ENUM('BRL', 'COP', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD')`
    );
    await queryRunner.query(
      `CREATE TABLE "generic_banks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "bank_id" uuid NOT NULL, "name" character varying(64) NOT NULL, "currency" "public"."generic_banks_currency_enum" NOT NULL, "balance" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_e59bdf560a11f678a216fef8f92" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "generic_banks" ADD CONSTRAINT "FK_generic_bank_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "generic_banks" ADD CONSTRAINT "FK_generic_bank_bank_id" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `GRANT SELECT, INSERT, UPDATE ON generic_banks TO my_money_app`
    );

    await queryRunner.query(
      `ALTER TABLE generic_banks ENABLE ROW LEVEL SECURITY`
    );
    await queryRunner.query(
      `ALTER TABLE generic_banks FORCE ROW LEVEL SECURITY`
    );

    await queryRunner.query(`
      CREATE POLICY select_generic_bank_logged_user ON generic_banks
      FOR SELECT USING (${loggedUser})
    `);
    await queryRunner.query(`
      CREATE POLICY insert_generic_bank_logged_user ON generic_banks
      FOR INSERT WITH CHECK (${loggedUser})
    `);
    await queryRunner.query(`
      CREATE POLICY update_generic_bank_logged_user ON generic_banks
      FOR UPDATE USING (${loggedUser}) WITH CHECK (${loggedUser})
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP POLICY IF EXISTS select_generic_bank_logged_user ON generic_banks`
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS insert_generic_bank_logged_user ON generic_banks`
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS update_generic_bank_logged_user ON generic_banks`
    );

    await queryRunner.query(
      `ALTER TABLE generic_banks DISABLE ROW LEVEL SECURITY`
    );

    await queryRunner.query(
      `ALTER TABLE "generic_banks" DROP CONSTRAINT "FK_generic_bank_bank_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "generic_banks" DROP CONSTRAINT "FK_generic_bank_user_id"`
    );
    await queryRunner.query(`DROP TABLE "generic_banks"`);
    await queryRunner.query(`DROP TYPE "public"."generic_banks_currency_enum"`);
  }
}
