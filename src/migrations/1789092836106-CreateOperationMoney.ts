import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOperationMoney1789092836106 implements MigrationInterface {
  name = "CreateOperationMoney1789092836106";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."operations_money_type_operation_enum" AS ENUM('PIX', 'DOC', 'TED', 'DEPOSIT', 'PAYMENT', 'TRANSFER', 'WITHDRAW', 'SEND', 'RECEIVE')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."operations_money_local_enum" AS ENUM('INTERNAL', 'EXTERNAL')`
    );
    await queryRunner.query(
      `CREATE TABLE "operations_money" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "money_id" uuid NOT NULL, "tag" character varying(64) NOT NULL, "description" character varying(256), "balance" numeric(10,2) NOT NULL, "discount" numeric(10,2), "forfeit" numeric(10,2), "amount" numeric(10,2) NOT NULL, "type_operation" "public"."operations_money_type_operation_enum" NOT NULL, "local" "public"."operations_money_local_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_operations_money" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_money" ADD CONSTRAINT "FK_operations_money_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_money" ADD CONSTRAINT "FK_operations_money_money" FOREIGN KEY ("money_id") REFERENCES "money"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "operations_money" DROP CONSTRAINT "FK_operations_money_money"`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_money" DROP CONSTRAINT "FK_operations_money_user"`
    );
    await queryRunner.query(`DROP TABLE "operations_money"`);
    await queryRunner.query(`DROP TYPE "public"."operations_money_local_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."operations_money_type_operation_enum"`
    );
  }
}
