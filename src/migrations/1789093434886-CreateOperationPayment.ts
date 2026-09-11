import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOperationPayment1789093434886 implements MigrationInterface {
  name = "CreateOperationPayment1789093434886";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."operations_payment_type_operation_enum" AS ENUM('PIX', 'DOC', 'TED', 'DEPOSIT', 'PAYMENT', 'TRANSFER', 'WITHDRAW', 'SEND', 'RECEIVE')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."operations_payment_local_enum" AS ENUM('INTERNAL', 'EXTERNAL')`
    );
    await queryRunner.query(
      `CREATE TABLE "operations_payment" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "bank_id" uuid, "money_id" uuid, "bank_box_id" uuid, "invoice_id" uuid, "tag" character varying(64) NOT NULL, "description" character varying(256), "balance" numeric(10,2) NOT NULL, "discount" numeric(10,2), "forfeit" numeric(10,2), "amount" numeric(10,2) NOT NULL, "type_operation" "public"."operations_payment_type_operation_enum" NOT NULL, "local" "public"."operations_payment_local_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_operations_payment" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_payment" ADD CONSTRAINT "FK_operations_payment_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_payment" ADD CONSTRAINT "FK_operations_payment_bank" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_payment" ADD CONSTRAINT "FK_operations_payment_money" FOREIGN KEY ("money_id") REFERENCES "money"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_payment" ADD CONSTRAINT "FK_operations_payment_invoice" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "operations_payment" DROP CONSTRAINT "FK_operations_payment_invoice"`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_payment" DROP CONSTRAINT "FK_operations_payment_money"`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_payment" DROP CONSTRAINT "FK_operations_payment_bank"`
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
