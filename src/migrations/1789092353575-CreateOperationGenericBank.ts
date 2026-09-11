import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOperationGenericBank1789092353575 implements MigrationInterface {
  name = "CreateOperationGenericBank1789092353575";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."operations_generic_bank_type_operation_enum" AS ENUM('PIX', 'DOC', 'TED', 'DEPOSIT', 'PAYMENT', 'TRANSFER', 'WITHDRAW', 'SEND', 'RECEIVE')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."operations_generic_bank_local_enum" AS ENUM('INTERNAL', 'EXTERNAL')`
    );
    await queryRunner.query(
      `CREATE TABLE "operations_generic_bank" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "generic_bank_id" uuid NOT NULL, "generic_bank_box_id" uuid, "tag" character varying(64) NOT NULL, "description" character varying(256), "balance" numeric(10,2) NOT NULL, "discount" numeric(10,2), "forfeit" numeric(10,2), "amount" numeric(10,2) NOT NULL, "type_operation" "public"."operations_generic_bank_type_operation_enum" NOT NULL, "local" "public"."operations_generic_bank_local_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_operations_generic_bank" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_generic_bank" ADD CONSTRAINT "FK_operation_generic_bank_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_generic_bank" ADD CONSTRAINT "FK_operation_generic_bank_generic_bank" FOREIGN KEY ("generic_bank_id") REFERENCES "generic_banks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_generic_bank" ADD CONSTRAINT "FK_operation_generic_bank_generic_bank_box" FOREIGN KEY ("generic_bank_box_id") REFERENCES "generic_bank_boxes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "operations_generic_bank" DROP CONSTRAINT "FK_operation_generic_bank_generic_bank_box"`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_generic_bank" DROP CONSTRAINT "FK_operation_generic_bank_generic_bank"`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_generic_bank" DROP CONSTRAINT "FK_operation_generic_bank_user"`
    );
    await queryRunner.query(`DROP TABLE "operations_generic_bank"`);
    await queryRunner.query(
      `DROP TYPE "public"."operations_generic_bank_local_enum"`
    );
    await queryRunner.query(
      `DROP TYPE "public"."operations_generic_bank_type_operation_enum"`
    );
  }
}
