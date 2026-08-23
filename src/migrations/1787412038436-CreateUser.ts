import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUser1787412038436 implements MigrationInterface {
  name = "CreateUser1787412038436";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const loggedUser = `"userId" = nullif(current_setting('app.current_user_id', true), '')::uuid`;

    await queryRunner.query(
      `CREATE TYPE "public"."users_gender_enum" AS ENUM('MALE', 'FEMALE', 'NOT_SAY')`
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(64) NOT NULL, "date_born" date NOT NULL, "gender" "public"."users_gender_enum" NOT NULL, "email" character varying(256) NOT NULL, "username" character varying(128) NOT NULL, "password" character varying(256) NOT NULL, "salary" numeric(10,2), "phone" character varying(32), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`
    );

    await queryRunner.query(
      `GRANT SELECT, INSERT, UPDATE ON users TO my_money_app`
    );

    await queryRunner.query(`ALTER TABLE users ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE users FORCE ROW LEVEL SECURITY`);

    await queryRunner.query(`
      CREATE POLICY select_user_logged_user ON users
      FOR SELECT USING (${loggedUser})
    `);
    await queryRunner.query(`
      CREATE POLICY insert_user_logged_user ON users
      FOR INSERT WITH CHECK (${loggedUser})
    `);
    await queryRunner.query(`
      CREATE POLICY update_user_logged_user ON users
      FOR UPDATE USING (${loggedUser}) WITH CHECK (${loggedUser})
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users DISABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_gender_enum"`);
  }
}
