import { MigrationInterface, QueryRunner } from "typeorm";

export class Starting1787411777403 implements MigrationInterface {
  name = "Starting1787411777403";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

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

    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
  }
}
