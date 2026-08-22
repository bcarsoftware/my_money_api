import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOperation1787415560149 implements MigrationInterface {
  name = "CreateOperation1787415560149";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."operations_local_enum" AS ENUM('INTERNAL', 'EXTERNAL')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."operations_origin_enum" AS ENUM('BANK', 'BANK_BOX', 'GENERIC_BANK', 'GENERIC_BANK_BOX', 'MONEY', 'PAYMENT')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."operations_flow_enum" AS ENUM('INFLOW', 'OUTFLOW')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."operations_operation_type_enum" AS ENUM('TRANSFER', 'PIX', 'DEPOSIT', 'WITHDRAWAL', 'PAYMENT', 'SEND', 'RECEIVE')`
    );
    await queryRunner.query(
      `CREATE TABLE "operations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "local" "public"."operations_local_enum" NOT NULL, "description" character varying(256) NOT NULL, "note" character varying(256), "origin" "public"."operations_origin_enum" NOT NULL, "flow" "public"."operations_flow_enum" NOT NULL, "operation_type" "public"."operations_operation_type_enum" NOT NULL, "balance" numeric(10,2) NOT NULL, "discount" numeric(10,2), "late_fee" numeric(10,2), "rate" numeric(10,2), "total" numeric(10,2) NOT NULL, "bank_id" uuid, "bank_box_id" uuid, "generic_bank_id" uuid, "generic_bank_box_id" uuid, "money_id" uuid, "payment_id" uuid, "invoice_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_7b62d84d6f9912b975987165856" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "operations" ADD CONSTRAINT "FK_operations_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "operations" ADD CONSTRAINT "FK_operations_bank_id" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "operations" ADD CONSTRAINT "FK_operations_bank_box_id" FOREIGN KEY ("bank_box_id") REFERENCES "bank_boxes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "operations" ADD CONSTRAINT "FK_operations_generic_bank_id" FOREIGN KEY ("generic_bank_id") REFERENCES "generic_banks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "operations" ADD CONSTRAINT "FK_operations_generic_bank_box_id" FOREIGN KEY ("generic_bank_box_id") REFERENCES "generic_bank_boxes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "operations" ADD CONSTRAINT "FK_operations_money_id" FOREIGN KEY ("money_id") REFERENCES "money"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "operations" ADD CONSTRAINT "FK_operations_payment_id" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "operations" ADD CONSTRAINT "FK_operations_invoice_id" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "operations" DROP CONSTRAINT "FK_operations_invoice_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "operations" DROP CONSTRAINT "FK_operations_payment_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "operations" DROP CONSTRAINT "FK_operations_money_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "operations" DROP CONSTRAINT "FK_operations_generic_bank_box_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "operations" DROP CONSTRAINT "FK_operations_generic_bank_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "operations" DROP CONSTRAINT "FK_operations_bank_box_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "operations" DROP CONSTRAINT "FK_operations_bank_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "operations" DROP CONSTRAINT "FK_operations_user_id"`
    );
    await queryRunner.query(`DROP TABLE "operations"`);
    await queryRunner.query(
      `DROP TYPE "public"."operations_operation_type_enum"`
    );
    await queryRunner.query(`DROP TYPE "public"."operations_flow_enum"`);
    await queryRunner.query(`DROP TYPE "public"."operations_origin_enum"`);
    await queryRunner.query(`DROP TYPE "public"."operations_local_enum"`);
  }
}
