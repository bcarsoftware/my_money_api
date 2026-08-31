import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePayment1787414478068 implements MigrationInterface {
  name = "CreatePayment1787414478068";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const loggedUser = `"user_id" = nullif(current_setting('app.current_user_id', true), '')::uuid`;

    await queryRunner.query(
      `CREATE TYPE "public"."payments_repeat_enum" AS ENUM('REPEAT', 'NO_REPEAT')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_month_enum" AS ENUM('JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_status_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')`
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "name" character varying(64) NOT NULL, "description" character varying(256), "repeat" "public"."payments_repeat_enum" NOT NULL, "balance" numeric(10,2) NOT NULL, "day" integer NOT NULL, "month" "public"."payments_month_enum" NOT NULL, "status" "public"."payments_status_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_payment_id" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_payment_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `GRANT SELECT, INSERT, UPDATE ON payments TO my_money_app`
    );

    await queryRunner.query(`ALTER TABLE payments ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE payments FORCE ROW LEVEL SECURITY`);

    await queryRunner.query(`
      CREATE POLICY select_payment_logged_user ON payments
      FOR SELECT USING (${loggedUser})
    `);
    await queryRunner.query(`
      CREATE POLICY insert_payment_logged_user ON payments
      FOR INSERT WITH CHECK (${loggedUser})
    `);
    await queryRunner.query(`
      CREATE POLICY update_payment_logged_user ON payments
      FOR UPDATE USING (${loggedUser}) WITH CHECK (${loggedUser})
    `);
    await queryRunner.query(`
      CREATE POLICY delete_payment_logged_user ON payments
      FOR DELETE USING (${loggedUser})
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP POLICY IF EXISTS select_payment_logged_user ON payments`
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS insert_payment_logged_user ON payments`
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS update_payment_logged_user ON payments`
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS delete_payment_logged_user ON payments`
    );

    await queryRunner.query(`ALTER TABLE payments DISABLE ROW LEVEL SECURITY`);

    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_payment_user_id"`
    );
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payments_month_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payments_repeat_enum"`);
  }
}
