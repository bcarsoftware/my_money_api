import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePix1787413263792 implements MigrationInterface {
  name = "CreatePix1787413263792";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."pix_type_key_enum" AS ENUM('RANDOM', 'CPF', 'CNPJ', 'PHONE', 'EMAIL')`
    );
    await queryRunner.query(
      `CREATE TABLE "pix" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bank_id" uuid NOT NULL, "tag" character varying(64) NOT NULL, "description" character varying(256), "type_key" "public"."pix_type_key_enum" NOT NULL, "key" character varying(512) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_da846dad51d704c2f2814148ae4" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "pix" ADD CONSTRAINT "FK_pix_bank_id" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `GRANT SELECT, INSERT, UPDATE ON pix TO my_money_app`
    );

    await queryRunner.query(`ALTER TABLE pix ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE pix FORCE ROW LEVEL SECURITY`);

    await queryRunner.query(`
      CREATE POLICY select_pix_logged_user ON pix
      FOR SELECT USING (is_user_logged())
    `);
    await queryRunner.query(`
      CREATE POLICY insert_pix_logged_user ON pix
      FOR INSERT WITH CHECK (is_user_logged())
    `);
    await queryRunner.query(`
      CREATE POLICY update_pix_logged_user ON pix
      FOR UPDATE USING (is_user_logged()) WITH CHECK (is_user_logged())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP POLICY IF EXISTS select_pix_logged_user ON pix`
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS insert_pix_logged_user ON pix`
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS update_pix_logged_user ON pix`
    );

    await queryRunner.query(`ALTER TABLE pix DISABLE ROW LEVEL SECURITY`);

    await queryRunner.query(
      `ALTER TABLE "pix" DROP CONSTRAINT "FK_pix_bank_id"`
    );
    await queryRunner.query(`DROP TABLE "pix"`);
    await queryRunner.query(`DROP TYPE "public"."pix_type_key_enum"`);
  }
}
