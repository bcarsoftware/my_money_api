import { MigrationInterface, QueryRunner } from "typeorm";

export class FunctionUserLogged1787412078185 implements MigrationInterface {
  name = "FunctionUserLogged1787412078185";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION is_user_logged() RETURNS boolean
      LANGUAGE sql SECURITY DEFINER STABLE AS $$
        SELECT EXISTS (
          SELECT 1
          FROM users u
          WHERE u."id" = nullif(current_setting('app.current_user_id', true), '')::uuid
            AND u."deleted_at" IS NULL
        )
      $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP FUNCTION IF EXISTS is_user_logged()`);
  }
}
