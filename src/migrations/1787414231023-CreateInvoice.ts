import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInvoice1787414231023 implements MigrationInterface {
  name = "CreateInvoice1787414231023";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."invoices_repeat_enum" AS ENUM('REPEAT', 'NO_REPEAT')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invoices_status_enum" AS ENUM('ACTIVE', 'COMPLETED', 'REFUNDED')`
    );
    await queryRunner.query(
      `CREATE TABLE "invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bank_id" uuid NOT NULL, "name" character varying(64) NOT NULL, "description" character varying(256), "repeat" "public"."invoices_repeat_enum" NOT NULL, "installments" integer NOT NULL DEFAULT '1', "paid_installments" integer NOT NULL DEFAULT '0', "balance" numeric(10,2) NOT NULL, "total" numeric(10,2) NOT NULL, "status" "public"."invoices_status_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoice_bank_id" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `GRANT SELECT, INSERT, UPDATE ON invoices TO my_money_app`
    );

    await queryRunner.query(`ALTER TABLE invoices ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE invoices FORCE ROW LEVEL SECURITY`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE invoices DISABLE ROW LEVEL SECURITY`);

    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "FK_invoice_bank_id"`
    );
    await queryRunner.query(`DROP TABLE "invoices"`);
    await queryRunner.query(`DROP TYPE "public"."invoices_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."invoices_repeat_enum"`);
  }
}
