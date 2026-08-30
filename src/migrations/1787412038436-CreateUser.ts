import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUser1787412038436 implements MigrationInterface {
  name = "CreateUser1787412038436";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const loggedUser = `"id" = nullif(current_setting('app.current_user_id', true), '')::uuid`;

    await queryRunner.query(
      `CREATE TYPE "public"."users_gender_enum" AS ENUM('MALE', 'FEMALE', 'NOT_SAY')`
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(64) NOT NULL, "date_born" date NOT NULL, "cpf" character varying(15), "gender" "public"."users_gender_enum" NOT NULL, "email" character varying(256) NOT NULL, "username" character varying(128) NOT NULL, "password" character varying(256) NOT NULL, "salary" numeric(10,2), "phone" character varying(32), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_email_unique" UNIQUE ("email"), CONSTRAINT "UQ_username_unique" UNIQUE ("username"), CONSTRAINT "UQ_cpf_unique" UNIQUE ("cpf"), CONSTRAINT "PK_user_id" PRIMARY KEY ("id"))`
    );

    await queryRunner.query(
      `GRANT SELECT, INSERT, UPDATE ON users TO my_money_app`
    );

    await queryRunner.query(`
      CREATE POLICY select_user ON users
      FOR SELECT USING (true)
    `);
    await queryRunner.query(`
      CREATE POLICY insert_user ON users
      FOR INSERT WITH CHECK (true)
    `);
    await queryRunner.query(`
      CREATE POLICY delete_user_logged_user ON users
      FOR DELETE USING (${loggedUser})
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS select_user ON users`);
    await queryRunner.query(`DROP POLICY IF EXISTS insert_user ON users`);
    await queryRunner.query(
      `DROP POLICY IF EXISTS delete_user_logged_user ON users`
    );

    await queryRunner.query(`ALTER TABLE users DISABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_gender_enum"`);
  }
}
