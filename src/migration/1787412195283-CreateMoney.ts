import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMoney1787412195283 implements MigrationInterface {
  name = "CreateMoney1787412195283";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "money" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "tag" character varying(64) NOT NULL, "objective" numeric(10,2), "description" character varying(256), "balance" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_532685f389ab66b70115668bf09" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "money" ADD CONSTRAINT "FK_money_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "money" DROP CONSTRAINT "FK_money_user_id"`
    );
    await queryRunner.query(`DROP TABLE "money"`);
  }
}
