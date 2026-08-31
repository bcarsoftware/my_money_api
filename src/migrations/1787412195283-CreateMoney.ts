import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMoney1787412195283 implements MigrationInterface {
  name = "CreateMoney1787412195283";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const loggedUser = `"user_id" = nullif(current_setting('app.current_user_id', true), '')::uuid`;

    await queryRunner.query(
      `CREATE TABLE "money" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "tag" character varying(64) NOT NULL, "objective" numeric(10,2), "description" character varying(256), "balance" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_money_id" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "money" ADD CONSTRAINT "FK_money_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `GRANT SELECT, INSERT, UPDATE ON money TO my_money_app`
    );

    await queryRunner.query(`ALTER TABLE money ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE money FORCE ROW LEVEL SECURITY`);

    await queryRunner.query(`
      CREATE POLICY select_money_logged_user ON money
      FOR SELECT USING (${loggedUser})
    `);
    await queryRunner.query(`
      CREATE POLICY insert_money_logged_user ON money
      FOR INSERT WITH CHECK (${loggedUser})
    `);
    await queryRunner.query(`
      CREATE POLICY update_money_logged_user ON money
      FOR UPDATE USING (${loggedUser}) WITH CHECK (${loggedUser})
    `);
    await queryRunner.query(`
      CREATE POLICY delete_money_logged_user ON money
      FOR DELETE USING (${loggedUser})
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP POLICY IF EXISTS select_money_logged_user ON money`
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS insert_money_logged_user ON money`
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS update_money_logged_user ON money`
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS delete_money_logged_user ON money`
    );

    await queryRunner.query(`ALTER TABLE money DISABLE ROW LEVEL SECURITY`);

    await queryRunner.query(
      `ALTER TABLE "money" DROP CONSTRAINT "FK_money_user_id"`
    );
    await queryRunner.query(`DROP TABLE "money"`);
  }
}
