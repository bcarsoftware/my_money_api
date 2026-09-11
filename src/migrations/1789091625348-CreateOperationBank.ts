import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOperationBank1789091625348 implements MigrationInterface {
  name = "CreateOperationBank1789091625348";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const loggedUser = `"user_id" = nullif(current_setting('app.current_user_id', true), '')::uuid`;

    await queryRunner.query(
      `CREATE TYPE "public"."operation_bank_type_operation_enum" AS ENUM('PIX', 'DOC', 'TED', 'DEPOSIT', 'PAYMENT', 'TRANSFER', 'WITHDRAW', 'SEND', 'RECEIVE')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."operation_bank_local_enum" AS ENUM('INTERNAL', 'EXTERNAL')`
    );
    await queryRunner.query(
      `CREATE TABLE "operations_bank" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "operation_register" uuid NOT NULL, "user_id" uuid NOT NULL, "bank_id" uuid NOT NULL, "bank_box_id" uuid, "invoice_id" uuid, "tag" character varying(64) NOT NULL, "description" character varying(256), "balance" numeric(10,2) NOT NULL, "discount" numeric(10,2), "forfeit" numeric(10,2), "amount" numeric(10,2) NOT NULL, "type_operation" "public"."operation_bank_type_operation_enum" NOT NULL, "local" "public"."operation_bank_local_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_operations_bank" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_bank" ADD CONSTRAINT "FK_operations_bank_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_bank" ADD CONSTRAINT "FK_operations_bank_bank" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_bank" ADD CONSTRAINT "FK_operations_bank_bank_box" FOREIGN KEY ("bank_box_id") REFERENCES "bank_boxes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_bank" ADD CONSTRAINT "FK_operations_bank_invoice" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_bank_operation_register_id" ON "operations_bank"  ("operation_register", "id") `
    );

    await queryRunner.query(
      `ALTER TABLE operations_bank ENABLE ROW LEVEL SECURITY`
    );
    await queryRunner.query(
      `ALTER TABLE operations_bank FORCE ROW LEVEL SECURITY`
    );

    await queryRunner.query(`
      CREATE POLICY select_operations_bank_logged_user ON operations_bank
      FOR SELECT USING (${loggedUser})
    `);
    await queryRunner.query(`
      CREATE POLICY insert_operations_bank_logged_user ON operations_bank
      FOR INSERT WITH CHECK (${loggedUser})
    `);
    await queryRunner.query(`
      CREATE POLICY update_operations_bank_logged_user ON operations_bank
      FOR UPDATE USING (${loggedUser}) WITH CHECK (${loggedUser})
    `);
    await queryRunner.query(`
      CREATE POLICY delete_operations_bank_logged_user ON operations_bank
      FOR DELETE USING (${loggedUser})
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP POLICY IF EXISTS select_operations_bank_logged_user ON operations_bank`
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS insert_operations_bank_logged_user ON operations_bank`
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS update_operations_bank_logged_user ON operations_bank`
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS delete_operations_bank_logged_user ON operations_bank`
    );

    await queryRunner.query(
      `ALTER TABLE operations_bank DISABLE ROW LEVEL SECURITY`
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_bank_operation_register_id"`
    );

    await queryRunner.query(
      `ALTER TABLE "operations_bank" DROP CONSTRAINT "FK_operations_bank_invoice"`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_bank" DROP CONSTRAINT "FK_operations_bank_bank_box"`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_bank" DROP CONSTRAINT "FK_operations_bank_bank"`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_bank" DROP CONSTRAINT "FK_operations_bank_user"`
    );

    await queryRunner.query(`DROP TABLE "operations_bank"`);
    await queryRunner.query(`DROP TYPE "public"."operation_bank_local_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."operation_bank_type_operation_enum"`
    );
  }
}
