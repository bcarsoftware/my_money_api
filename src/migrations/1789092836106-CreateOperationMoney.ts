import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOperationMoney1789092836106 implements MigrationInterface {
  name = "CreateOperationMoney1789092836106";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const loggedUser = `"user_id" = nullif(current_setting('app.current_user_id', true), '')::uuid`;

    await queryRunner.query(
      `CREATE TYPE "public"."operations_money_type_operation_enum" AS ENUM('PIX', 'DOC', 'TED', 'DEPOSIT', 'PAYMENT', 'TRANSFER', 'WITHDRAW', 'SEND', 'RECEIVE')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."operations_money_local_enum" AS ENUM('INTERNAL', 'EXTERNAL')`
    );
    await queryRunner.query(
      `CREATE TABLE "operations_money" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "operation_register" uuid NOT NULL, "user_id" uuid NOT NULL, "money_id" uuid NOT NULL, "tag" character varying(64) NOT NULL, "description" character varying(256), "balance" numeric(10,2) NOT NULL, "discount" numeric(10,2), "forfeit" numeric(10,2), "amount" numeric(10,2) NOT NULL, "type_operation" "public"."operations_money_type_operation_enum" NOT NULL, "local" "public"."operations_money_local_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_operations_money" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_money" ADD CONSTRAINT "FK_operations_money_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "operations_money" ADD CONSTRAINT "FK_operations_money_money" FOREIGN KEY ("money_id") REFERENCES "money"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_money_operation_register_id" ON "operations_money"  ("operation_register", "id") `
    );

    await queryRunner.query(
      `ALTER TABLE operations_money ENABLE ROW LEVEL SECURITY`
    );
    await queryRunner.query(
      `ALTER TABLE operations_money FORCE ROW LEVEL SECURITY`
    );

    await queryRunner.query(`
      CREATE POLICY select_operations_money_logged_user ON operations_money
      FOR SELECT USING (${loggedUser})
    `);
    await queryRunner.query(`
      CREATE POLICY insert_operations_money_logged_user ON operations_money
      FOR INSERT WITH CHECK (${loggedUser})
    `);
    await queryRunner.query(`
      CREATE POLICY update_operations_money_logged_user ON operations_money
      FOR UPDATE USING (${loggedUser}) WITH CHECK (${loggedUser})
    `);
    await queryRunner.query(`
      CREATE POLICY delete_operations_money_logged_user ON operations_money
      FOR DELETE USING (${loggedUser})
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP POLICY IF EXISTS select_operations_money_logged_user ON operations_money`
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS insert_operations_money_logged_user ON operations_money`
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS update_operations_money_logged_user ON operations_money`
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS delete_operations_money_logged_user ON operations_money`
    );

    await queryRunner.query(
      `ALTER TABLE operations_money DISABLE ROW LEVEL SECURITY`
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_money_operation_register_id"`
    );

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
