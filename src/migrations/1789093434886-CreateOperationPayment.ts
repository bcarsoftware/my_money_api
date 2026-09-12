import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOperationPayment1789093434886 implements MigrationInterface {
  name = "CreateOperationPayment1789093434886";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const loggedUser = `"user_id" = nullif(current_setting('app.current_user_id', true), '')::uuid`;

    await queryRunner.query(
      `CREATE TYPE "public"."operations_payment_type_operation_enum" AS ENUM('PIX', 'DOC', 'TED', 'DEPOSIT', 'PAYMENT', 'TRANSFER', 'WITHDRAW', 'SEND', 'RECEIVE')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."operations_payment_local_enum" AS ENUM('INTERNAL', 'EXTERNAL')`
    );
    await queryRunner.query(
      `CREATE TABLE "operations_payment" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "operation_register" uuid NOT NULL, "user_id" uuid NOT NULL, "payment_id" uuid NOT NULL, "bank_id" uuid, "generic_bank_id" uuid, "money_id" uuid, "tag" character varying(64) NOT NULL, "description" character varying(256), "balance" numeric(10,2) NOT NULL, "discount" numeric(10,2), "forfeit" numeric(10,2), "amount" numeric(10,2) NOT NULL, "type_operation" "public"."operations_payment_type_operation_enum" NOT NULL, "local" "public"."operations_payment_local_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_operations_payment" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_payment" ADD CONSTRAINT "FK_operations_payment_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_payment" ADD CONSTRAINT "FK_operations_payment_payment" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_payment" ADD CONSTRAINT "FK_operations_payment_bank" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_payment" ADD CONSTRAINT "FK_operations_payment_generic_bank" FOREIGN KEY ("generic_bank_id") REFERENCES "generic_banks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_payment" ADD CONSTRAINT "FK_operations_payment_money" FOREIGN KEY ("money_id") REFERENCES "money"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_payment_operation_register_id" ON "operations_payment"  ("operation_register", "id") `
    );

    await queryRunner.query(
      `ALTER TABLE operations_payment ENABLE ROW LEVEL SECURITY`
    );
    await queryRunner.query(
      `ALTER TABLE operations_payment FORCE ROW LEVEL SECURITY`
    );

    await queryRunner.query(`
      CREATE POLICY select_operations_payment_logged_user ON operations_payment
      FOR SELECT USING (${loggedUser})
    `);
    await queryRunner.query(`
      CREATE POLICY insert_operations_payment_logged_user ON operations_payment
      FOR INSERT WITH CHECK (${loggedUser})
    `);
    await queryRunner.query(`
      CREATE POLICY update_operations_payment_logged_user ON operations_payment
      FOR UPDATE USING (${loggedUser}) WITH CHECK (${loggedUser})
    `);
    await queryRunner.query(`
      CREATE POLICY delete_operations_payment_logged_user ON operations_payment
      FOR DELETE USING (${loggedUser})
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP POLICY IF EXISTS select_operations_payment_logged_user ON operations_payment`
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS insert_operations_payment_logged_user ON operations_payment`
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS update_operations_payment_logged_user ON operations_payment`
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS delete_operations_payment_logged_user ON operations_payment`
    );

    await queryRunner.query(
      `ALTER TABLE operations_payment DISABLE ROW LEVEL SECURITY`
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_payment_operation_register_id"`
    );

    await queryRunner.query(
      `ALTER TABLE "operations_payment" DROP CONSTRAINT "FK_operations_payment_payment"`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_payment" DROP CONSTRAINT "FK_operations_payment_bank"`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_payment" DROP CONSTRAINT "FK_operations_payment_generic_bank"`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_payment" DROP CONSTRAINT "FK_operations_payment_money"`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_payment" DROP CONSTRAINT "FK_operations_payment_user"`
    );
    await queryRunner.query(`DROP TABLE "operations_payment"`);
    await queryRunner.query(
      `DROP TYPE "public"."operations_payment_local_enum"`
    );
    await queryRunner.query(
      `DROP TYPE "public"."operations_payment_type_operation_enum"`
    );
  }
}
